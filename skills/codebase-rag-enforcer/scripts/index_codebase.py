#!/usr/bin/env python3
"""
Index codebase into ChromaDB with proper chunking and metadata.
FIXED: Windows encoding, ChromaDB metadata lists, robust path handling.
"""
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from pathlib import Path
import hashlib
import re
from datetime import datetime
import sys

# Import config from same directory
try:
    from rag_config import *
except ImportError:
    print("❌ rag_config.py not found. Run setup_rag.py first.")
    sys.exit(1)

class CodebaseIndexer:
    def __init__(self):
        self.client = chromadb.PersistentClient(
            path=CHROMA_PERSIST_DIR,
            settings=Settings(anonymized_telemetry=False)
        )
        self.model = SentenceTransformer(EMBEDDING_MODEL)
        self.stats = {"files_indexed": 0, "chunks_created": 0, "errors": []}
    
    def index(self):
        print("🔍 Starting codebase indexing...")
        self._reset_collections()
        
        # Index code files
        if CODE_ROOT.exists():
            self._index_directory(CODE_ROOT, COLLECTION_CODE)
        if BACKEND_ROOT.exists() and BACKEND_ROOT != CODE_ROOT:
            self._index_directory(BACKEND_ROOT, COLLECTION_CODE)
        
        # Index constraints
        self._index_constraints()
        
        # Index patterns
        self._index_patterns()
        
        self._print_stats()
        return self.stats
    
    def _reset_collections(self):
        for name in [COLLECTION_CODE, COLLECTION_CONSTRAINTS, COLLECTION_PATTERNS]:
            try:
                self.client.delete_collection(name)
            except:
                pass
            self.client.create_collection(name, metadata={"hnsw:space": "cosine"})
    
    def _index_directory(self, root_path, collection_name):
        collection = self.client.get_collection(collection_name)
        
        for file_path in Path(root_path).rglob("*"):
            if any(excluded in file_path.parts for excluded in EXCLUDE_DIRS):
                continue
            if file_path.suffix not in INCLUDE_EXTENSIONS:
                continue
            if file_path.is_file():
                try:
                    self._index_file(file_path, collection)
                    self.stats["files_indexed"] += 1
                except Exception as e:
                    self.stats["errors"].append(f"{file_path}: {str(e)}")
    
    def _index_file(self, file_path, collection):
        try:
            # FIX 1: Explicit UTF-8 encoding for Windows
            content = file_path.read_text(encoding='utf-8')
        except UnicodeDecodeError:
            # Skip binary files
            return
        
        metadata = self._extract_metadata(file_path, content)
        metadata["weight"] = self._calculate_weight(file_path)
        
        chunks = self._chunk_content(content, file_path)
        
        for i, chunk in enumerate(chunks):
            chunk_id = self._generate_id(file_path, i)
            chunk_metadata = {**metadata, "chunk_index": i}
            embedding = self.model.encode(chunk).tolist()
            
            collection.add(
                ids=[chunk_id],
                embeddings=[embedding],
                documents=[chunk],
                metadatas=[chunk_metadata]
            )
            self.stats["chunks_created"] += 1
    
    def _chunk_content(self, content, file_path):
        lines = content.split('\n')
        chunks = []
        
        for i in range(0, len(lines), CHUNK_SIZE - CHUNK_OVERLAP):
            chunk_lines = lines[i:i + CHUNK_SIZE]
            header = f"File: {file_path.relative_to(PROJECT_ROOT)}\nLines: {i+1}-{i+len(chunk_lines)}\n\n"
            chunks.append(header + '\n'.join(chunk_lines))
        
        return chunks if chunks else [content]
    
    def _extract_metadata(self, file_path, content):
        relative_path = str(file_path.relative_to(PROJECT_ROOT))
        metadata = {
            "file_path": relative_path,
            "file_type": file_path.suffix,
            "last_modified": datetime.fromtimestamp(file_path.stat().st_mtime).isoformat(),
        }
        
        if file_path.suffix in ['.js', '.jsx', '.ts', '.tsx']:
            # Extract imports
            imports = re.findall(r'import\s+.*?\s+from\s+[\'"](.+?)[\'"]', content)
            imports += re.findall(r'require\([\'"](.+?)[\'"]\)', content)
            
            # FIX 2: Convert list to comma-separated string for ChromaDB
            if imports:
                metadata["imports"] = ",".join(imports[:10])
            
            # Extract exports
            exports = re.findall(r'export\s+(?:default\s+)?(?:function|class|const)\s+(\w+)', content)
            if exports:
                metadata["exports"] = ",".join(exports[:10])
            
            # Extract API endpoints
            if 'router.' in content:
                endpoints = re.findall(r'router\.(get|post|put|delete|patch)\([\'"](.+?)[\'"]', content)
                if endpoints:
                    formatted = [f"{m.upper()} {p}" for m, p in endpoints]
                    metadata["api_endpoints"] = ",".join(formatted)
            
            # Extract WebSocket events
            if 'socket.emit' in content or 'io.emit' in content:
                events = re.findall(r'(?:socket|io)\.emit\([\'"](.+?)[\'"]', content)
                if events:
                    metadata["websocket_events"] = ",".join(list(set(events))[:10])
        
        return metadata
    
    def _calculate_weight(self, file_path):
        relative_path = str(file_path.relative_to(PROJECT_ROOT))
        for pattern, weight in WEIGHTS.items():
            if pattern in relative_path:
                return weight
        return 1.0
    
    def _index_constraints(self):
        collection = self.client.get_collection(COLLECTION_CONSTRAINTS)
        
        for file_name in ["ARCHITECTURE.yml", "CONSTRAINTS.md", "CLAUDE.md"]:
            file_path = PROJECT_ROOT / file_name
            if file_path.exists():
                try:
                    content = file_path.read_text(encoding='utf-8')
                    embedding = self.model.encode(content).tolist()
                    collection.add(
                        ids=[str(file_path.name)],
                        embeddings=[embedding],
                        documents=[content],
                        metadatas=[{
                            "file_path": str(file_path.relative_to(PROJECT_ROOT)),
                            "type": "constraint",
                            "weight": 10.0
                        }]
                    )
                    self.stats["chunks_created"] += 1
                except Exception as e:
                    self.stats["errors"].append(f"{file_path}: {str(e)}")
    
    def _index_patterns(self):
        collection = self.client.get_collection(COLLECTION_PATTERNS)
        patterns_dir = PROJECT_ROOT / "docs" / "patterns"
        
        if not patterns_dir.exists():
            return
        
        for file_path in patterns_dir.glob("*.md"):
            try:
                content = file_path.read_text(encoding='utf-8')
                embedding = self.model.encode(content).tolist()
                collection.add(
                    ids=[str(file_path.name)],
                    embeddings=[embedding],
                    documents=[content],
                    metadatas=[{
                        "file_path": str(file_path.relative_to(PROJECT_ROOT)),
                        "type": "pattern",
                        "weight": 8.0
                    }]
                )
                self.stats["chunks_created"] += 1
            except Exception as e:
                self.stats["errors"].append(f"{file_path}: {str(e)}")
    
    def _generate_id(self, file_path, chunk_index):
        data = f"{file_path.relative_to(PROJECT_ROOT)}::{chunk_index}"
        return hashlib.md5(data.encode()).hexdigest()
    
    def _print_stats(self):
        print(f"\n✅ Indexing complete!")
        print(f"📁 Files indexed: {self.stats['files_indexed']}")
        print(f"📦 Chunks created: {self.stats['chunks_created']}")
        
        if self.stats['errors']:
            print(f"\n⚠️  Errors ({len(self.stats['errors'])}):")
            for error in self.stats['errors'][:5]:
                print(f"  - {error}")
            if len(self.stats['errors']) > 5:
                print(f"  ... and {len(self.stats['errors']) - 5} more")

if __name__ == "__main__":
    indexer = CodebaseIndexer()
    stats = indexer.index()
    
    if stats['chunks_created'] == 0:
        print("\n❌ CRITICAL: No chunks created. Check configuration.")
        sys.exit(1)
    
    if len(stats['errors']) > stats['files_indexed'] * 0.1:
        print("\n⚠️  WARNING: High error rate during indexing.")
        sys.exit(1)
