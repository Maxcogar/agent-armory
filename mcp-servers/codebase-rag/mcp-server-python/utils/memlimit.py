"""Hard per-process memory cap.

A corrupted on-disk HNSW segment makes chroma-hnswlib's loader request an
allocation sized from untrusted header fields (tens of GB from a few-MB
index). On Windows that allocation is committed against the pagefile, so
the whole machine runs out of commit before any polling watchdog can react.

The cap makes such an allocation *fail* inside the process instead: hnswlib
raises "Not enough memory", Python raises MemoryError, and the caller treats
the index as corrupt and rebuilds it. Nothing outside the process is harmed.

  Windows: the process joins a Job Object with JOB_OBJECT_LIMIT_PROCESS_MEMORY
           (limits committed memory).
  Linux:   RLIMIT_DATA (limits private writable mappings: heap + anonymous
           mmap, which is where malloc memory comes from).
  Other:   not enforced; logged once.

RAG_MAX_MEMORY_GB sets the cap (default 4). 0 disables it.
"""

import ctypes
import logging
import os
import sys
from typing import Optional


log = logging.getLogger(__name__)


DEFAULT_MAX_MEMORY_GB = 4.0

# Keeps the job handle alive for the life of the process.
_job_handle: Optional[int] = None


def configured_limit_bytes() -> Optional[int]:
    """Bytes from RAG_MAX_MEMORY_GB, or None when the cap is disabled."""
    raw = os.environ.get("RAG_MAX_MEMORY_GB")
    try:
        gb = float(raw) if raw else DEFAULT_MAX_MEMORY_GB
    except ValueError:
        log.warning("invalid RAG_MAX_MEMORY_GB=%r; using %s", raw, DEFAULT_MAX_MEMORY_GB)
        gb = DEFAULT_MAX_MEMORY_GB
    if gb <= 0:
        return None
    return int(gb * 2**30)


def apply_memory_limit(limit_bytes: Optional[int] = None) -> bool:
    """Cap this process's memory. Returns True if a cap is now enforced."""
    if limit_bytes is None:
        limit_bytes = configured_limit_bytes()
    if limit_bytes is None:
        log.info("memory cap disabled (RAG_MAX_MEMORY_GB=0)")
        return False
    try:
        if sys.platform == "win32":
            _apply_windows(limit_bytes)
        elif sys.platform.startswith("linux"):
            _apply_linux(limit_bytes)
        else:
            log.warning("memory cap not enforced on %s", sys.platform)
            return False
    except OSError as e:
        log.warning("could not apply memory cap: %s", e)
        return False
    log.info("memory cap: %.1f GB", limit_bytes / 2**30)
    return True


def _apply_linux(limit_bytes: int) -> None:
    import resource

    _, hard = resource.getrlimit(resource.RLIMIT_DATA)
    if hard != resource.RLIM_INFINITY:
        limit_bytes = min(limit_bytes, hard)
    resource.setrlimit(resource.RLIMIT_DATA, (limit_bytes, hard))


# --- Windows Job Object (winnt.h layouts, 64- and 32-bit safe) ---

_JobObjectExtendedLimitInformation = 9
_JOB_OBJECT_LIMIT_PROCESS_MEMORY = 0x00000100


class _IO_COUNTERS(ctypes.Structure):
    _fields_ = [(name, ctypes.c_uint64) for name in (
        "ReadOperationCount", "WriteOperationCount", "OtherOperationCount",
        "ReadTransferCount", "WriteTransferCount", "OtherTransferCount",
    )]


class _JOBOBJECT_BASIC_LIMIT_INFORMATION(ctypes.Structure):
    _fields_ = [
        ("PerProcessUserTimeLimit", ctypes.c_int64),
        ("PerJobUserTimeLimit", ctypes.c_int64),
        ("LimitFlags", ctypes.c_uint32),
        ("MinimumWorkingSetSize", ctypes.c_size_t),
        ("MaximumWorkingSetSize", ctypes.c_size_t),
        ("ActiveProcessLimit", ctypes.c_uint32),
        ("Affinity", ctypes.c_size_t),
        ("PriorityClass", ctypes.c_uint32),
        ("SchedulingClass", ctypes.c_uint32),
    ]


class _JOBOBJECT_EXTENDED_LIMIT_INFORMATION(ctypes.Structure):
    _fields_ = [
        ("BasicLimitInformation", _JOBOBJECT_BASIC_LIMIT_INFORMATION),
        ("IoInfo", _IO_COUNTERS),
        ("ProcessMemoryLimit", ctypes.c_size_t),
        ("JobMemoryLimit", ctypes.c_size_t),
        ("PeakProcessMemoryUsed", ctypes.c_size_t),
        ("PeakJobMemoryUsed", ctypes.c_size_t),
    ]


def _apply_windows(limit_bytes: int) -> None:
    global _job_handle
    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)  # type: ignore[attr-defined]
    kernel32.CreateJobObjectW.restype = ctypes.c_void_p
    kernel32.CreateJobObjectW.argtypes = [ctypes.c_void_p, ctypes.c_wchar_p]
    kernel32.SetInformationJobObject.restype = ctypes.c_int
    kernel32.SetInformationJobObject.argtypes = [
        ctypes.c_void_p, ctypes.c_int, ctypes.c_void_p, ctypes.c_uint32,
    ]
    kernel32.GetCurrentProcess.restype = ctypes.c_void_p
    kernel32.AssignProcessToJobObject.restype = ctypes.c_int
    kernel32.AssignProcessToJobObject.argtypes = [ctypes.c_void_p, ctypes.c_void_p]

    job = kernel32.CreateJobObjectW(None, None)
    if not job:
        raise ctypes.WinError(ctypes.get_last_error())  # type: ignore[attr-defined]

    info = _JOBOBJECT_EXTENDED_LIMIT_INFORMATION()
    info.BasicLimitInformation.LimitFlags = _JOB_OBJECT_LIMIT_PROCESS_MEMORY
    info.ProcessMemoryLimit = limit_bytes
    if not kernel32.SetInformationJobObject(
        job, _JobObjectExtendedLimitInformation, ctypes.byref(info), ctypes.sizeof(info),
    ):
        raise ctypes.WinError(ctypes.get_last_error())  # type: ignore[attr-defined]
    if not kernel32.AssignProcessToJobObject(job, kernel32.GetCurrentProcess()):
        raise ctypes.WinError(ctypes.get_last_error())  # type: ignore[attr-defined]
    _job_handle = job
