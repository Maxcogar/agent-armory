"""
Probe the FeatureCAM automation API for the WRITE / AUTHORING / VERIFY surface
that the official export examples never exercise, so we stop guessing.

Run on Windows with FeatureCAM open and a real part loaded (ideally one with
several milling features + operations already programmed). It only READS —
it introspects objects and dumps member lists + probe-reads of specific
properties. It does not set, create, delete, save, or post anything.

Usage:
    python probe_write_surface.py > probe_write_surface_results.txt 2>&1

Then send probe_write_surface_results.txt back.
"""

import json
import pythoncom
import win32com.client


def members(obj):
    try:
        return sorted(a for a in dir(obj) if not a.startswith("_"))
    except Exception as e:
        return [f"<dir failed: {e}>"]


def probe_props(obj, names):
    """Try reading each named property; report value or why it failed."""
    out = {}
    for n in names:
        try:
            v = getattr(obj, n)
            out[n] = "<method/callable>" if callable(v) else repr(v)
        except Exception as e:
            out[n] = f"<ERR: {type(e).__name__}: {e}>"
    return out


def section(title):
    print("\n" + "=" * 70)
    print(title)
    print("=" * 70)


pythoncom.CoInitialize()
app = win32com.client.gencache.EnsureDispatch("FeatureCAM.Application")
raw = app.ActiveDocument
doc = win32com.client.CastTo(raw, "IFMDocument")

section("APPLICATION members")
print("\n".join(members(app)))
# App-level things we care about: post options, open-by-path, verifier hooks
print("\n-- app probe-reads --")
print(json.dumps(probe_props(app, [
    "PostOptionsMill", "GetMillPostOptions", "GetMillPostOptions2",
    "SetMillPostOptions", "Open", "OpenDocument", "Documents", "Visible",
]), indent=2))

section("DOCUMENT members")
print("\n".join(members(doc)))
print("\n-- doc probe-reads (authoring / AFR / NC data) --")
print(json.dumps(probe_props(doc, [
    "RecognizeFeatures", "RecognizeFeatures2", "RecognizeFeatures3",
    "RecognizeFeatures4", "AFR", "GetAFROptions", "SetAFROptions",
    "AddHole", "AddPocket", "AddBoss", "AddSetup", "AddSetup2",
    "SaveNC", "SaveNC2", "GetSaveNCData", "GetSaveNCData2",
    "Post", "MachineSim", "SimMachine", "Sim3D", "SimRapidcut",
    "SelectedOperations", "Features", "Operations", "Stock",
]), indent=2))

section("doc.Features collection")
try:
    feats = doc.Features
    print("Features members:\n" + "\n".join(members(feats)))
except Exception as e:
    print(f"<doc.Features ERR: {e}>")

# ---- FMOperation: the load-bearing one. Feeds/speeds/DOC/stepover/plunge. ----
section("FIRST OPERATION — full member dump + feed/speed/DOC probe")
try:
    op = doc.Operations.Item(1)
    print(f"Operation 1 name: {op.Name}")
    print("\nOperation members:\n" + "\n".join(members(op)))
    print("\n-- operation probe-reads --")
    print(json.dumps(probe_props(op, [
        "Feed", "FeedText", "FeedRate", "Feedrate",
        "Speed", "SpeedText", "SpindleSpeed", "RPM",
        "Depth", "DepthText", "DepthOfCut", "MaxDepthOfCut",
        "StepOver", "Stepover", "Stepdown", "StepDown",
        "PlungeFeed", "RampFeed", "RetractFeed", "LeadInFeed",
        "Coolant", "CoolantOverride",
        "Tool", "FeatureName", "OperationName", "Errors", "Warnings",
        "MachTimeSeconds", "MachTimeString",
    ]), indent=2))
except Exception as e:
    print(f"<operation probe ERR: {e}>")

# ---- FMFeature: strategy attributes (DOC, stepover live here in the GUI) ----
section("FIRST FEATURE of active setup — full member dump + strategy probe")
try:
    setup = doc.ActiveSetup
    feat = setup.Features.Item(1)
    print(f"Feature 1 name: {feat.Name}, ModelType: {feat.ModelType}")
    print("\nFeature members:\n" + "\n".join(members(feat)))
    print("\n-- feature probe-reads (strategy / F&S / tool assignment) --")
    print(json.dumps(probe_props(feat, [
        "Feed", "Speed", "FinishFeed", "RoughFeed",
        "Stepover", "StepOver", "Stepdown", "MaxDepth",
        "roughing_tool", "finish_tool", "RoughTool", "FinishTool", "Tool",
        "strategy", "Strategy", "HolderClearance", "ShankClearance",
        "collision_check", "CollisionCheck", "GougeCheck",
        "operations", "Operations", "attrs", "Attribute",
    ]), indent=2))
except Exception as e:
    print(f"<feature probe ERR: {e}>")

# ---- Stock setters ----
section("STOCK — setter probe")
try:
    stock = doc.Stock
    print(json.dumps(probe_props(stock, [
        "SetDimensions", "SetLocation", "ReSize", "Material",
        "Hardness", "Fluid", "SetStockSolid", "GetDimensions",
    ]), indent=2))
except Exception as e:
    print(f"<stock probe ERR: {e}>")

# ---- Tool crib / tool assignment ----
section("ACTIVE TOOL CRIB")
try:
    crib = doc.get_ActiveToolCrib()
    print("ToolCrib members:\n" + "\n".join(members(crib)))
except Exception as e:
    print(f"<tool crib ERR: {e}>")

# ---- Any verification/collision result surface anywhere? ----
section("VERIFICATION RESULT SEARCH — doc members containing key substrings")
needles = ["colli", "gouge", "verif", "remov", "volume", "excess", "sim",
           "result", "report"]
hits = [m for m in members(doc) if any(n in m.lower() for n in needles)]
print("doc members matching {" + ", ".join(needles) + "}:")
print("\n".join(hits) if hits else "(none)")

pythoncom.CoUninitialize()
print("\n\nDONE.")
