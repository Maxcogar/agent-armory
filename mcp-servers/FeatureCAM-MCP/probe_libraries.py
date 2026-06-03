"""Probe tool cribs, tool holders, and fixtures."""
import win32com.client
import pythoncom

pythoncom.CoInitialize()
app = win32com.client.gencache.EnsureDispatch("FeatureCAM.Application")
raw_doc = app.ActiveDocument
doc = win32com.client.CastTo(raw_doc, "IFMDocument")


def dump(obj, label, max_depth=1):
    if obj is None:
        print(f"  {label}: None")
        return
    attrs = [a for a in dir(obj) if not a.startswith("_")]
    print(f"\n{label} ({type(obj).__name__}):")
    for a in sorted(attrs):
        print(f"  {a}")


print("=" * 60)
print("APPLICATION-LEVEL LIBRARIES")
print("=" * 60)
app_attrs = sorted([a for a in dir(app) if not a.startswith("_")])
print(f"\nApplication attributes:")
for a in app_attrs:
    print(f"  {a}")

# Check for app-level libraries
print("\n--- App-level library access ---")
for name in ["ToolLibrary", "ToolCribs", "ToolCrib", "MachineLibrary",
             "PostLibrary", "MaterialLibrary", "Libraries", "Library"]:
    try:
        obj = getattr(app, name)
        print(f"  app.{name}: {type(obj).__name__}")
        if hasattr(obj, "Count"):
            print(f"    Count: {obj.Count}")
    except AttributeError:
        pass
    except Exception as e:
        print(f"  app.{name}: ERROR {e}")

print("\n" + "=" * 60)
print("DOCUMENT-LEVEL LIBRARIES")
print("=" * 60)

# ToolCribs on doc
for name in ["ToolCribs", "ActiveToolCrib", "ActiveToolCribObj", "ToolList"]:
    try:
        obj = getattr(doc, name)
        if callable(obj):
            obj = obj()
        print(f"\ndoc.{name}: {type(obj).__name__ if obj else None}")
        if obj and hasattr(obj, "Count"):
            print(f"  Count: {obj.Count}")
        dump(obj, f"  doc.{name}")
    except Exception as e:
        print(f"\ndoc.{name}: ERROR {e}")

# Check ToolCribs collection - iterate
try:
    tc = doc.ToolCribs
    print(f"\nToolCribs.Count = {tc.Count}")
    if tc.Count > 0:
        crib = tc.Item(1)
        print(f"\nFirst ToolCrib attributes:")
        for a in sorted([a for a in dir(crib) if not a.startswith("_")]):
            print(f"  {a}")
        # Try to get tool count
        for sub in ["EndMills", "FaceMills", "TwistDrills", "SpotDrills",
                    "Taps", "ThreadMills", "Reams", "BoringBars", "ChamferMills",
                    "CounterBores", "CounterSinks", "RoundingMills", "SideMills",
                    "PlungeRoughers", "Tools"]:
            try:
                coll = getattr(crib, sub)
                if hasattr(coll, "Count"):
                    print(f"  crib.{sub}.Count = {coll.Count}")
                    if coll.Count > 0:
                        item = coll.Item(1)
                        print(f"    First {sub}: {item.Name}")
                        # List attributes of first tool
                        if sub == "EndMills":
                            tool_attrs = sorted([a for a in dir(item) if not a.startswith("_")])
                            print(f"    EndMill attrs: {tool_attrs}")
            except AttributeError:
                pass
            except Exception as e:
                print(f"  crib.{sub}: ERROR {e}")
except Exception as e:
    print(f"ToolCribs iteration error: {e}")

# Check holders
print("\n" + "=" * 60)
print("TOOL HOLDERS")
print("=" * 60)

try:
    # Get a real tool holder from an operation
    op = doc.Operations.Item(1)
    tool = op.Tool
    print(f"First op tool: {tool.Name}")
    print(f"Holder (str): {tool.Holder!r}")
    dh = tool.DefaultHolder
    print(f"\nDefaultHolder attributes:")
    for a in sorted([a for a in dir(dh) if not a.startswith("_")]):
        print(f"  {a}")
    # Try common properties
    for prop in ["Name", "Diameter", "Length", "Type", "HolderType",
                 "MaximumDiameter", "MinimumDiameter", "TaperLength"]:
        try:
            val = getattr(dh, prop)
            if not callable(val):
                print(f"  DefaultHolder.{prop} = {val}")
        except:
            pass
except Exception as e:
    print(f"Holder probe error: {e}")

# Fixtures — check setup for fixture-related attrs
print("\n" + "=" * 60)
print("FIXTURES")
print("=" * 60)

setup = doc.Setups.Item(1)
setup_attrs = sorted([a for a in dir(setup) if not a.startswith("_")])
print(f"\nSetup attributes (for fixture-related):")
for a in setup_attrs:
    if "fix" in a.lower() or "clamp" in a.lower() or "model" in a.lower():
        print(f"  {a}")

# Check solids — fixtures are usually modeled as solids marked UseAsClamp
try:
    print(f"\nSolids count: {doc.Solids.Count}")
    for i in range(1, doc.Solids.Count + 1):
        s = doc.Solids.Item(i)
        s_attrs = sorted([a for a in dir(s) if not a.startswith("_")])
        print(f"\nSolid {i}: {s.Name}")
        print(f"  Attributes: {s_attrs}")
        # Check any clamp/fixture flag
        for prop in ["UseAsClamp", "IsClamp", "IsFixture", "FixtureType",
                     "ClampType", "Type", "Purpose"]:
            try:
                val = getattr(s, prop)
                if not callable(val):
                    print(f"  {prop} = {val}")
            except:
                pass
except Exception as e:
    print(f"Solids error: {e}")

# Material library
print("\n" + "=" * 60)
print("MATERIALS")
print("=" * 60)
print(f"Stock.Material: {doc.Stock.Material}")
for prop in ["Hardness", "UnitHorsepower_CuttingForce"]:
    try:
        val = getattr(doc.Stock, prop)
        print(f"Stock.{prop}: {val}")
    except:
        pass

pythoncom.CoUninitialize()
