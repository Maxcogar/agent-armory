# pytest Setup Reference

Configuration and setup patterns sourced from pytest docs (docs.pytest.org/en/stable).

## Installation

```bash
# pip
pip install pytest pytest-cov

# With async support
pip install pytest pytest-asyncio pytest-cov

# With FastAPI
pip install pytest pytest-asyncio httpx pytest-cov

# poetry
poetry add --group dev pytest pytest-cov pytest-asyncio

# uv
uv add --dev pytest pytest-cov pytest-asyncio
```

## Configuration: pyproject.toml

The `[tool.pytest]` section uses native TOML types (arrays, not space-separated strings).

```toml
[tool.pytest]
minversion = "9.0"
addopts = ["-ra", "-q", "--strict-markers"]
testpaths = ["tests"]
pythonpath = ["src"]
```

If the project also uses pytest-asyncio:

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
asyncio_default_fixture_loop_scope = "function"
```

**Important**: `[tool.pytest]` is the native TOML form (pytest 9+). `[tool.pytest.ini_options]` is the older INI-compat form. Both work. Use `[tool.pytest]` for new projects. pytest-asyncio settings go under `[tool.pytest.ini_options]` because that plugin reads from ini_options.

## Directory Structure

```
project/
├── src/                    # or project source at root
│   └── mypackage/
├── tests/
│   ├── __init__.py         # empty — needed for test discovery in packages
│   ├── conftest.py         # shared fixtures
│   ├── test_core.py        # unit tests grouped by module
│   └── integration/        # optional separation
│       ├── __init__.py
│       └── test_api.py
└── pyproject.toml
```

**Test discovery rules**: pytest finds files matching `test_*.py` or `*_test.py`. Within those files, it collects functions prefixed `test_` and classes prefixed `Test` (no `__init__` method). Directories named `tests` are searched by default when `testpaths` is set.

## conftest.py Patterns

conftest.py files provide fixtures to all tests in their directory and subdirectories. No imports needed — pytest discovers them automatically. You can have multiple conftest.py files at different directory levels; fixtures resolve from closest to root.

### Basic shared fixtures

```python
import pytest

@pytest.fixture
def sample_data():
    """Provides reusable test data."""
    return {"key": "value", "count": 42}

@pytest.fixture
def tmp_config(tmp_path):
    """Create a temporary config file."""
    config_file = tmp_path / "config.toml"
    config_file.write_text('[app]\nname = "test"\n')
    return config_file
```

### Fixture scopes

Scopes control how often a fixture is created: `function` (default, per-test), `class`, `module`, `package`, `session`.

```python
@pytest.fixture(scope="session")
def db_engine():
    """One database engine for the entire test session."""
    engine = create_engine("sqlite:///:memory:")
    yield engine
    engine.dispose()

@pytest.fixture(scope="function")
def db_session(db_engine):
    """Fresh session per test, rolled back after."""
    connection = db_engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()
```

### Async fixtures (pytest-asyncio)

```python
import pytest_asyncio

@pytest_asyncio.fixture
async def async_client(app):
    """Async HTTP test client for FastAPI."""
    from httpx import AsyncClient, ASGITransport
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
```

## Markers

Register custom markers in pyproject.toml to avoid warnings:

```toml
[tool.pytest]
markers = [
    "slow: marks tests as slow (deselect with '-m \"not slow\"')",
    "integration: marks integration tests",
]
```

Use `--strict-markers` (in `addopts`) to error on unregistered markers.

### Controlling slow tests via conftest.py

```python
import pytest

def pytest_addoption(parser):
    parser.addoption("--runslow", action="store_true", default=False, help="run slow tests")

def pytest_configure(config):
    config.addinivalue_line("markers", "slow: mark test as slow to run")

def pytest_collection_modifyitems(config, items):
    if config.getoption("--runslow"):
        return
    skip_slow = pytest.mark.skip(reason="need --runslow option to run")
    for item in items:
        if "slow" in item.keywords:
            item.add_marker(skip_slow)
```

## Coverage

```toml
[tool.coverage.run]
source = ["src"]
branch = true

[tool.coverage.report]
show_missing = true
fail_under = 80
exclude_lines = [
    "pragma: no cover",
    "if TYPE_CHECKING:",
    "if __name__ == .__main__.",
]
```

Run: `pytest --cov --cov-report=term-missing`

## FastAPI Testing Pattern

```python
import pytest
from httpx import AsyncClient, ASGITransport
from myapp.main import app

@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
```
