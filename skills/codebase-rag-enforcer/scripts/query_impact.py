#!/usr/bin/env python3
"""Query what else might be affected by changing a file"""
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from pathlib import Path
import sys

try:
    from rag_config import *
except ImportError:
    print("❌ rag_config.py not found. Run setup_rag.py first.")
    sys.exit(1)

class ImpactAnalyzer:
    def __init__(self):
        self.client = chromadb.PersistentClient(
            path=CHROMA_PERSIST_DIR,
            settings=Settings(anonymized_telemetry=False)
        )
        self.model = SentenceTransformer(EMBEDDING_MODEL)
    
    def analyze(self, file_path, num_results=10):
        print(f"\n🎯 Impact analysis for: {file_path}\n")
        
        collection = self.client.get_collection(COLLECTION_CODE)
        file_chunks = self._find_file_chunks(collection, file_path)
        
        if not file_chunks:
            print(f"❌ File not found in index: {file_path}")
            print("Try running: python index_codebase.py")
            return
        
        # Extract key information (handle comma-separated strings)
        exports = set()
        api_endpoints = set()
        websocket_events = set()
        
        for chunk in file_chunks:
            metadata = chunk['metadata']
            
            # Parse comma-separated metadata
            if 'exports' in metadata and metadata['exports']:
                exports.update(metadata['exports'].split(','))
            if 'api_endpoints' in metadata and metadata['api_endpoints']:
                api_endpoints.update(metadata['api_endpoints'].split(','))
            if 'websocket_events' in metadata and metadata['websocket_events']:
                websocket_events.update(metadata['websocket_events'].split(','))
        
        print("=" * 80)
        print("📤 WHAT THIS FILE EXPORTS")
        print("=" * 80)
        if exports:
            for exp in exports:
                print(f"  - {exp}")
        else:
            print("  (No exports detected)")
        
        if api_endpoints:
            print(f"\n🔌 API ENDPOINTS")
            for endpoint in api_endpoints:
                print(f"  - {endpoint}")
        
        if websocket_events:
            print(f"\n📡 WEBSOCKET EVENTS")
            for event in websocket_events:
                print(f"  - {event}")
        
        # Find dependents
        print("\n" + "=" * 80)
        print("⚠️  FILES THAT DEPEND ON THIS")
        print("=" * 80)
        
        importers = self._find_importers(collection, file_path, exports)
        
        if importers:
            for importer in importers:
                print(f"\n📄 {importer['metadata']['file_path']}")
                imports_str = importer['metadata'].get('imports', '')
                if imports_str:
                    imports = imports_str.split(',')
                    matching = [imp for imp in imports if file_path in imp]
                    if matching:
                        print(f"   Imports: {', '.join(matching)}")
        else:
            print("  ✅ No direct dependents found")
        
        # Find semantic neighbors
        print("\n" + "=" * 80)
        print("🔗 SIMILAR FILES (might need coordination)")
        print("=" * 80)
        
        neighbors = self._find_semantic_neighbors(collection, file_chunks[0]['content'], file_path)
        
        for neighbor in neighbors[:5]:
            print(f"\n📄 {neighbor['metadata']['file_path']}")
            print(f"   Similarity: {1 - neighbor['distance']:.2%}")
    
    def _find_file_chunks(self, collection, file_path):
        results = collection.get(where={"file_path": {"$eq": file_path}})
        chunks = []
        
        if results['ids']:
            for i in range(len(results['ids'])):
                chunks.append({
                    'id': results['ids'][i],
                    'content': results['documents'][i],
                    'metadata': results['metadatas'][i]
                })
        
        return chunks
    
    def _find_importers(self, collection, file_path, exports):
        file_name = Path(file_path).stem
        
        # Search for files that contain this path in their imports metadata
        results = collection.get()
        
        importers = []
        if results['ids']:
            for i in range(len(results['ids'])):
                metadata = results['metadatas'][i]
                if metadata['file_path'] != file_path:
                    imports_str = metadata.get('imports', '')
                    if file_name in imports_str or file_path in imports_str:
                        importers.append({
                            'metadata': metadata,
                            'content': results['documents'][i]
                        })
        
        return importers
    
    def _find_semantic_neighbors(self, collection, content, exclude_path):
        query_embedding = self.model.encode(content).tolist()
        results = collection.query(query_embeddings=[query_embedding], n_results=10)
        
        neighbors = []
        if results['ids'] and results['ids'][0]:
            for i in range(len(results['ids'][0])):
                file_path = results['metadatas'][0][i]['file_path']
                if file_path != exclude_path:
                    neighbors.append({
                        'metadata': results['metadatas'][0][i],
                        'distance': results['distances'][0][i]
                    })
        
        return neighbors

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python query_impact.py <file_path>")
        print("\nExample:")
        print("  python query_impact.py backend/routes/auth.js")
        sys.exit(1)
    
    file_path = sys.argv[1]
    analyzer = ImpactAnalyzer()
    analyzer.analyze(file_path)
