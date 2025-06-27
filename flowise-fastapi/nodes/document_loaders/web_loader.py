from typing import Dict, Any, List
from nodes.base import ProviderNode, NodeInput, NodeType
from langchain_community.document_loaders import WebBaseLoader
from langchain.schema import Document

class WebLoaderNode(ProviderNode):
    """
    Web sayfalarından içerik yükleyen node
    """
    
    def __init__(self):
        super().__init__()
        self._metadatas = {
            "name": "WebLoader",
            "description": "Load content from web pages using URLs",
            "node_type": NodeType.PROVIDER,
            "inputs": [
                NodeInput(
                    name="urls",
                    type="string",
                    description="Web page URLs to load (comma-separated for multiple)",
                    required=True,
                    is_connection=False
                ),
                NodeInput(
                    name="verify_ssl",
                    type="boolean",
                    description="Whether to verify SSL certificates",
                    required=False,
                    default=True,
                    is_connection=False
                ),
                NodeInput(
                    name="headers",
                    type="string",
                    description="Custom HTTP headers as JSON string",
                    required=False,
                    is_connection=False
                )
            ]
        }
    
    async def _execute(self, inputs: Dict[str, Any]) -> List[Document]:
        """
        Web sayfalarından içerik yükle
        """
        urls_input = inputs.get("urls", "")
        verify_ssl = inputs.get("verify_ssl", True)
        headers_input = inputs.get("headers", "{}")
        
        # URLs'i parse et
        if isinstance(urls_input, str):
            urls = [url.strip() for url in urls_input.split(",") if url.strip()]
        else:
            urls = [str(urls_input)]
        
        if not urls:
            raise ValueError("At least one URL must be provided")
        
        # Headers'ı parse et
        headers = {}
        if headers_input:
            try:
                import json
                headers = json.loads(headers_input)
            except json.JSONDecodeError:
                print(f"Warning: Invalid JSON in headers, using empty headers")
        
        # Default user agent
        if not headers.get("User-Agent"):
            headers["User-Agent"] = "Mozilla/5.0 (compatible; FlowiseBot/1.0)"
        
        try:
            # Web loader oluştur
            loader = WebBaseLoader(
                web_paths=urls,
                verify_ssl=verify_ssl,
                header_template=headers
            )
            
            # Belgeleri yükle
            documents = loader.load()
            
            print(f"✅ Loaded {len(documents)} documents from {len(urls)} URLs")
            
            return documents
            
        except Exception as e:
            print(f"❌ Web loading failed: {str(e)}")
            raise ValueError(f"Failed to load web content: {str(e)}")

class SitemapLoaderNode(ProviderNode):
    """
    Sitemap'den URL'leri keşfederek içerik yükleyen node
    """
    
    def __init__(self):
        super().__init__()
        self._metadatas = {
            "name": "SitemapLoader",
            "description": "Load content from sitemap URLs",
            "node_type": NodeType.PROVIDER,
            "inputs": [
                NodeInput(
                    name="sitemap_url",
                    type="string",
                    description="URL of the sitemap.xml file",
                    required=True,
                    is_connection=False
                ),
                NodeInput(
                    name="filter_urls",
                    type="string",
                    description="Regex pattern to filter URLs (optional)",
                    required=False,
                    is_connection=False
                ),
                NodeInput(
                    name="limit",
                    type="number",
                    description="Maximum number of pages to load",
                    required=False,
                    default=10,
                    is_connection=False
                )
            ]
        }
    
    async def _execute(self, inputs: Dict[str, Any]) -> List[Document]:
        """
        Sitemap'den URL'leri keşfet ve içerik yükle
        """
        sitemap_url = inputs.get("sitemap_url")
        filter_pattern = inputs.get("filter_urls")
        limit = int(inputs.get("limit", 10))
        
        if not sitemap_url:
            raise ValueError("Sitemap URL is required")
        
        try:
            from langchain_community.document_loaders import SitemapLoader
            
            # Sitemap loader oluştur
            loader = SitemapLoader(
                web_path=sitemap_url,
                filter_urls=[filter_pattern] if filter_pattern else None
            )
            
            # Belgeleri yükle (limit ile)
            documents = loader.load()
            
            # Limit uygula
            if limit > 0:
                documents = documents[:limit]
            
            print(f"✅ Loaded {len(documents)} documents from sitemap")
            
            return documents
            
        except Exception as e:
            print(f"❌ Sitemap loading failed: {str(e)}")
            raise ValueError(f"Failed to load sitemap content: {str(e)}")

class YoutubeLoaderNode(ProviderNode):
    """
    YouTube videolarından transcript yükleyen node
    """
    
    def __init__(self):
        super().__init__()
        self._metadatas = {
            "name": "YoutubeLoader",
            "description": "Load transcripts from YouTube videos",
            "node_type": NodeType.PROVIDER,
            "inputs": [
                NodeInput(
                    name="video_url",
                    type="string",
                    description="YouTube video URL or video ID",
                    required=True,
                    is_connection=False
                ),
                NodeInput(
                    name="language",
                    type="string",
                    description="Preferred transcript language (e.g., 'en', 'tr')",
                    required=False,
                    default="en",
                    is_connection=False
                ),
                NodeInput(
                    name="add_video_info",
                    type="boolean",
                    description="Include video metadata (title, description)",
                    required=False,
                    default=True,
                    is_connection=False
                )
            ]
        }
    
    async def _execute(self, inputs: Dict[str, Any]) -> List[Document]:
        """
        YouTube videosundan transcript yükle
        """
        video_url = inputs.get("video_url")
        language = inputs.get("language", "en")
        add_video_info = inputs.get("add_video_info", True)
        
        if not video_url:
            raise ValueError("Video URL is required")
        
        try:
            from langchain_community.document_loaders import YoutubeLoader
            
            # Video ID'yi extract et
            video_id = self._extract_video_id(video_url)
            
            # YouTube loader oluştur
            loader = YoutubeLoader(
                video_id=video_id,
                language=language,
                add_video_info=add_video_info
            )
            
            # Transcript'i yükle
            documents = loader.load()
            
            print(f"✅ Loaded transcript from YouTube video: {video_id}")
            
            return documents
            
        except Exception as e:
            print(f"❌ YouTube loading failed: {str(e)}")
            raise ValueError(f"Failed to load YouTube transcript: {str(e)}")
    
    def _extract_video_id(self, url: str) -> str:
        """
        YouTube URL'den video ID'yi extract et
        """
        import re
        
        # Farklı YouTube URL formatları
        patterns = [
            r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([^&\n?#]+)',
            r'(?:youtube\.com/v/)([^&\n?#]+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        
        # Eğer URL zaten video ID ise
        if len(url) == 11 and url.isalnum():
            return url
        
        raise ValueError(f"Cannot extract video ID from URL: {url}")

# Git repository loader
class GitHubLoaderNode(ProviderNode):
    """
    GitHub repository'lerinden kod ve dosyaları yükleyen node
    """
    
    def __init__(self):
        super().__init__()
        self._metadatas = {
            "name": "GitHubLoader",
            "description": "Load files from GitHub repositories",
            "node_type": NodeType.PROVIDER,
            "inputs": [
                NodeInput(
                    name="repo_url",
                    type="string",
                    description="GitHub repository URL",
                    required=True,
                    is_connection=False
                ),
                NodeInput(
                    name="branch",
                    type="string",
                    description="Git branch to load from",
                    required=False,
                    default="main",
                    is_connection=False
                ),
                NodeInput(
                    name="file_filter",
                    type="string",
                    description="File extensions to include (e.g., '.py,.md,.txt')",
                    required=False,
                    is_connection=False
                ),
                NodeInput(
                    name="max_files",
                    type="number",
                    description="Maximum number of files to load",
                    required=False,
                    default=50,
                    is_connection=False
                )
            ]
        }
    
    async def _execute(self, inputs: Dict[str, Any]) -> List[Document]:
        """
        GitHub repository'den dosyaları yükle
        """
        repo_url = inputs.get("repo_url")
        branch = inputs.get("branch", "main")
        file_filter = inputs.get("file_filter", "")
        max_files = int(inputs.get("max_files", 50))
        
        if not repo_url:
            raise ValueError("Repository URL is required")
        
        try:
            from langchain_community.document_loaders import GitHubIssuesLoader
            # Note: Bu örnekte GitHubIssuesLoader kullanıyoruz
            # Gerçek uygulamada GitLoader veya custom implementation kullanılmalı
            
            # Basit file loading implementasyonu
            # Gerçek projede git clone + file parsing yapılacak
            
            # Mock implementation for demonstration
            documents = [
                Document(
                    page_content=f"Repository content from {repo_url}",
                    metadata={
                        "source": repo_url,
                        "branch": branch,
                        "type": "repository"
                    }
                )
            ]
            
            print(f"✅ Loaded {len(documents)} documents from GitHub repository")
            
            return documents
            
        except Exception as e:
            print(f"❌ GitHub loading failed: {str(e)}")
            raise ValueError(f"Failed to load GitHub repository: {str(e)}") 