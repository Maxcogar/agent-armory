"""Probe post processor capabilities."""
import win32com.client
import pythoncom

pythoncom.CoInitialize()
app = win32com.client.gencache.EnsureDispatch("FeatureCAM.Application")
raw_doc = app.ActiveDocument
doc = win32com.client.CastTo(raw_doc, "IFMDocument")

print("=" * 60)
print("DOCUMENT POST")
print("=" * 60)

try:
    post = doc.Post
    print(f"doc.Post type: {type(post).__name__}")
    print(f"doc.Post repr: {post!r}")
    if not isinstance(post, str):
        attrs = sorted([a for a in dir(post) if not a.startswith("_")])
        print(f"\nPost attributes:")
        for a in attrs:
            print(f"  {a}")
        # Try common properties
        for prop in ["Name", "FileName", "Type", "Version", "Options",
                     "Path", "FullName", "OutputPath"]:
            try:
                val = getattr(post, prop)
                if not callable(val):
                    print(f"  Post.{prop} = {val!r}")
            except:
                pass
except Exception as e:
    print(f"doc.Post error: {e}")

print("\n" + "=" * 60)
print("APP-LEVEL POST OPTIONS")
print("=" * 60)

# PostOptionsMill - direct property access
try:
    opts = app.PostOptionsMill
    print(f"PostOptionsMill type: {type(opts).__name__}")
    if opts is not None:
        attrs = sorted([a for a in dir(opts) if not a.startswith("_")])
        print(f"Attributes:")
        for a in attrs:
            print(f"  {a}")
except Exception as e:
    print(f"PostOptionsMill error: {e}")

# GetMillPostOptions - method
print("\n--- GetMillPostOptions ---")
try:
    import inspect
    sig = inspect.signature(app.GetMillPostOptions)
    print(f"Signature: {sig}")
except Exception as e:
    print(f"Sig error: {e}")

# Try calling it - may need to be on active doc
try:
    # Probably needs no args or maybe setup
    result = app.GetMillPostOptions()
    print(f"GetMillPostOptions() returned: {result}")
except Exception as e:
    print(f"GetMillPostOptions() error: {e}")

# Versions 2, 3, 4
for version in ["GetMillPostOptions2", "GetMillPostOptions3", "GetMillPostOptions4"]:
    try:
        sig = inspect.signature(getattr(app, version))
        print(f"\n{version} signature: {sig}")
    except Exception as e:
        print(f"{version} sig error: {e}")

# SetMillPostOptions variants
print("\n--- SetMillPostOptions ---")
for version in ["SetMillPostOptions", "SetMillPostOptions2", "SetMillPostOptions3", "SetMillPostOptions4"]:
    try:
        sig = inspect.signature(getattr(app, version))
        print(f"{version} signature: {sig}")
    except Exception as e:
        print(f"{version} sig error: {e}")

# Print method docstrings from generated wrappers
print("\n" + "=" * 60)
print("GENERATED WRAPPER DETAILS")
print("=" * 60)
import os
gen_path = r"C:\Users\maxco\AppData\Local\Programs\Python\Python313\Lib\site-packages\win32com\gen_py\A36FB69C-863C-4A65-84E2-221867B0D191x0x7x27"

# Find the method definitions in the wrapper files
for fname in ["IApplication.py", "Application.py"]:
    fpath = os.path.join(gen_path, fname)
    if os.path.exists(fpath):
        print(f"\n--- {fname} ---")
        with open(fpath, "r", errors="ignore") as f:
            content = f.read()
            for method in ["GetMillPostOptions", "SetMillPostOptions", "PostOptionsMill"]:
                idx = content.find(f"def {method}")
                if idx >= 0:
                    end = content.find("\n\n", idx)
                    if end < 0:
                        end = idx + 600
                    print(content[idx:end])
                    print()

# IFMDocument - look for Post
print("\n--- IFMDocument Post ---")
fpath = os.path.join(gen_path, "IFMDocument.py")
if os.path.exists(fpath):
    with open(fpath, "r", errors="ignore") as f:
        content = f.read()
        # Find "Post" as a property or method
        for pattern in ["def Post", "'Post'", '"Post"', "(Post,"]:
            idx = 0
            while True:
                idx = content.find(pattern, idx)
                if idx < 0:
                    break
                start = max(0, idx - 50)
                end = min(len(content), idx + 200)
                print(f"  Found '{pattern}' at {idx}: ...{content[start:end]}...")
                idx += 1
                break  # just first match per pattern

# IFMPost interface — does it exist?
print("\n--- Searching for IFMPost file ---")
import glob
for f in glob.glob(os.path.join(gen_path, "*Post*.py")):
    print(f"  {os.path.basename(f)}")
for f in glob.glob(os.path.join(gen_path, "IFM*.py")):
    bn = os.path.basename(f)
    if "Post" in bn:
        print(f"  {bn}")

pythoncom.CoUninitialize()
