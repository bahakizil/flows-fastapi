# Gemini Proje Hafızası: Flowise FastAPI Backend (v0.3 - Standardizasyon Mimarisi)

Bu dosya, bizim (Gemini ve sen) geliştirmekte olduğumuz Flowise benzeri uygulamanın backend'i için bir hafıza, felsefe ve teknik yol haritası görevi görür. Bu versiyon, projenin temel felsefesini "klonlamadan" öteye taşıyarak, **geliştirici dostu, modüler ve standartlaştırılmış bir node oluşturma altyapısı** üzerine odaklanan köklü bir değişimi yansıtmaktadır.

---

## 1. Projenin Felsefesi ve Nihai Hedefi

**Ana Hedef:** Flowise'dan esinlenerek, kullanıcıların görsel bir arayüzde AI bileşenlerini (node'lar) birleştirerek karmaşık AI/LLM iş akışları oluşturmasını sağlayan bir uygulamanın backend'ini FastAPI ile geliştirmek.

**Gözden Geçirilmiş Felsefe (v0.3): Geliştirici Odaklı Modülerlik ve Standardizasyon**

Flowise'ın birebir kopyasını yapmak yerine, onun en güçlü yanlarını alıp daha da ileri taşıyan bir felsefe benimsiyoruz. Önceliğimiz güvenlik veya veritabanı değil, **sağlam, esnek ve kolayca genişletilebilir bir backend mimarisi kurmaktır.** Bu mimarinin temel taşı, **node yaratma sürecini standartlaştırmaktır.**

Amacımız, herhangi bir Python geliştiricisinin, bizim belirlediğimiz net ve basit kurallara uyarak, kendi özel node'unu (bir LLM, bir araç, bir API entegrasyonu vb.) kolayca oluşturup sisteme "tak-çalıştır" mantığıyla dahil edebilmesini sağlamaktır.

Bu felsefe, iki ana prensibe dayanır:
1.  **Node'lar Aptal Fabrikalardır:** Her bir node, sadece belirli bir LangChain nesnesini (`BaseChatModel`, `BaseTool`, `Runnable` vb.) yapılandırıp döndürmekten sorumludur. Kendi içinde çalıştırma (`invoke`, `run`) mantığı barındırmaz.
2.  **Workflow Motoru Akıllıdır:** `core/workflow_runner.py` modülü, projenin beyni olarak çalışır. Node'ları ve bağlantıları alır, onları doğru sırada başlatır ve LangChain Expression Language (LCEL) kullanarak çalıştırılabilir bir zincir inşa eder.

---

## 2. Yeni Standart Node Mimarisi (En Önemli Geliştirme)

Node oluşturmayı standartlaştırmak ve basitleştirmek için, tüm node'ların türeyeceği **anlamlı bir sınıf hiyerarşisi** tasarladık. Artık her node, genel bir `BaseNode`'dan değil, amacını belli eden **3 özel temel sınıftan birinden** türemek zorundadır.

Bu yapı, bir geliştiriciyi doğru node tipini seçmeye yönlendirir ve mimari tutarlılığı zorunlu kılar.

### 2.1. Temel Sınıflar (`nodes/base.py`)

- **`BaseNode (Soyut Ana Sınıf)`**: Tüm node'ların atasıdır. Metadata doğrulama gibi ortak mantığı içerir.
- **`ProviderNode (Sağlayıcı)`**:
    - **Amacı:** Sıfırdan bir LangChain nesnesi (LLM, Tool, Prompt, Memory) oluşturur.
    - **Özelliği:** Başka bir node'a doğrudan bağımlılığı yoktur. Girdileri kullanıcı tarafından sağlanır.
    - **Örnekler:** `OpenAINode`, `GeminiNode`, `SerperDevTool`.
- **`ProcessorNode (İşleyici)`**:
    - **Amacı:** Birden fazla LangChain nesnesini (`Runnable`) girdi olarak alıp bunları birleştirerek yeni ve daha karmaşık bir `Runnable` oluşturur.
    - **Özelliği:** Zincirin ortasında yer alır ve diğer node'lara bağımlıdır.
    - **Örnekler:** `ReactAgentNode` (LLM, Tools, Prompt'u birleştirir).
- **`TerminatorNode (Sonlandırıcı)`**:
    - **Amacı:** Bir zincirin sonuna eklenir ve çıktıyı işler, formatlar veya dönüştürür.
    - **Özelliği:** Genellikle tek bir `Runnable`'ı girdi olarak alır ve zincirin son halini oluşturur.
    - **Örnekler:** `StringOutputParserNode`, `PydanticOutputParserNode`.

### 2.2. Metadata Standardı (`NodeMetadata` Pydantic Modeli)

Her node, `_metadatas` adında bir sözlük tanımlamak zorundadır. Bu sözlük, `NodeMetadata` Pydantic modeli tarafından doğrulanır ve şu alanları içerir:
- `name`: Node'un benzersiz kimliği.
- `description`: Node'un ne işe yaradığı.
- `node_type`: Yukarıdaki 3 türden biri (`NodeType` Enum).
- `inputs`: `NodeInput` Pydantic modellerinden oluşan bir liste. Her girdi şunları tanımlar:
    - `name`, `type`, `description`, `required`.
    - `is_connection`: Bu girdinin başka bir node'dan mı (True) yoksa kullanıcıdan mı (False) geleceğini belirtir. Bu, `workflow_runner` için kritik bir bilgidir.

---

## 3. Mevcut Durum ve Tamamlananlar (v0.3 itibarıyla)

- **Mimari Yeniden Yapılandırma:** Proje, Flowise'ın "aptal fabrika, akıllı motor" felsefesine tam uyumlu hale getirildi. LangGraph tabanlı ilk prototip tamamen terk edildi.
- **Dinamik Node Keşfi:** `core/node_discovery.py` sayesinde, `nodes/` klasörüne eklenen her yeni node otomatik olarak sisteme dahil edilir.
- **Temel API Endpoint'leri:**
    - `/api/v1/nodes`: Frontend'in node paletini oluşturması için keşfedilen tüm node'ların standartlaştırılmış `metadata`'sını döndürür.
    - `/api/v1/workflows/execute`: Bir workflow tanımını alıp çalıştırır.
- **Genişletilmiş Node Kütüphanesi:** Aşağıdaki node'lar oluşturulmuş ve sisteme eklenmiştir:
    - **Provider Nodes:** `OpenAINode`, `GeminiNode`, `PromptTemplateNode`, `SerperDevTool`, `TavilySearchResults`, `WikipediaToolNode`, `GoogleSearchToolNode`, `ConversationMemoryNode`.
    - **Processor Nodes:** `ReactAgentNode`.
    - **Terminator Nodes:** `StringOutputParserNode`, `PydanticOutputParserNode`.

### 3.1. Önemli Güncellemeler (ÖNCELİK 1 TAMAMLANDI)

**ÖNCELİK 1 tamamen uygulandı ve sistem yeni standart mimariye geçirildi:**

1. **`nodes/base.py` Yeniden Yapılandırıldı:**
   - `NodeType` Enum'u (PROVIDER, PROCESSOR, TERMINATOR) eklendi
   - `NodeInput` ve `NodeMetadata` Pydantic modelleri standardize edildi
   - `BaseNode`, `ProviderNode`, `ProcessorNode`, ve `TerminatorNode` soyut sınıfları oluşturuldu
   - Her sınıf, kendi amacına özgü `_execute` metod imzasına sahip

2. **Mevcut Tüm Node'lar Yeni Standartlara Göç Ettirildi:**
   - **LLM Nodes:** `GeminiNode`, `OpenAINode` → `ProviderNode`
   - **Tool Nodes:** `SerperSearchNode`, `TavilySearchNode`, `WikipediaToolNode`, `GoogleSearchToolNode` → `ProviderNode`
   - **Prompt Nodes:** `PromptTemplateNode`, `AgentPromptNode` → `ProviderNode`
   - **Memory Nodes:** `ConversationMemoryNode` → `ProviderNode`
   - **Output Parser Nodes:** `StringOutputParserNode`, `PydanticOutputParserNode` → `TerminatorNode`
   - **Agent Nodes:** `ReactAgentNode` → `ProcessorNode`

3. **`core/workflow_runner.py` Tamamen Yeniden Yazıldı:**
   - Node'ları türlerine göre sınıflandırma
   - Aşamalı çalıştırma: Provider → Processor → Terminator
   - Connected nodes ve user inputs'ları doğru şekilde yönetme
   - Robust hata yönetimi ve zincir oluşturma

---

## 4. Detaylı Yol Haritası ve Sonraki Adımlar

Önceliğimiz, tasarladığımız bu standart mimariyi hayata geçirmek ve mevcut sistemi bu yapıya tam uyumlu hale getirmektir.

~~**ÖNCELİK 1: Standart Node Mimarisi'ni Kodda Hayata Geçirmek (TAMAMLANDI ✅)**~~

~~1. **`nodes/base.py`'ı Refactor Et:** ✅ TAMAMLANDI~~
~~2. **Mevcut Tüm Node'ları Yeni Standartlara Göç Et:** ✅ TAMAMLANDI~~
~~3. **`core/workflow_runner.py`'ı Güncelle:** ✅ TAMAMLANDI~~

**Bu aşama tamamen tamamlandı. Sistem artık yeni standart mimaride çalışıyor.**

**ÖNCELİK 2: Node Kütüphanesini Stratejik Olarak Büyütmek (Yeni Standartlarla)**

Bu temel oturduktan sonra, Flowise'daki en kritik eksik node'ları **yeni standartlarımıza uygun olarak** ekleyeceğiz:
- **Document Loaders (`ProviderNode` olarak):** `PDFLoaderNode`, `WebBaseLoaderNode`, `TextLoaderNode`.
- **Text Splitters (`ProcessorNode` olarak):** `RecursiveCharacterTextSplitterNode`.
- **Vector Stores (`ProcessorNode` olarak):** `ChromaNode` (sadece retriever değil, döküman ekleme yeteneği de olan).
- **Retrievers (`ProcessorNode` olarak):** `VectorStoreRetrieverNode`.

**ÖNCELİK 3: Uzun Vadeli Hedefler**

Bu iki öncelik tamamlandıktan sonra odaklanacağımız konular:
- **WebSocket ile Streaming Desteği:** Gerçek zamanlı, interaktif bir deneyim için.
- **Veritabanı Entegrasyonu:** Workflow'ları ve konuşma geçmişlerini kalıcı hale getirmek için.
- **Güvenli Credential Yönetimi:** API anahtarlarını şifreli bir şekilde saklamak için.
- **Frontend Entegrasyonu:** Tüm bu backend altyapısını görsel bir arayüze bağlamak için.

---

Bu döküman, projenin mevcut durumunu ve geleceğini net bir şekilde ortaya koymaktadır. Bir sonraki adıma geçtiğimizde, **ÖNCELİK 1**'deki görevleri sırasıyla tamamlayarak başlayacağız.