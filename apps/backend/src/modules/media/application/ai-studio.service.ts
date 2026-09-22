import axios from 'axios';
import { MediaService } from './media.service';
import fs from 'fs';

interface ReferenceImage {
  path?: string;
  buffer?: Buffer;
  mimetype: string;
  originalname?: string;
}

interface ShotPrompt {
  id: string;
  title: string;
  badge: string;
  description: string;
  prompt: string;
}

interface GeneratedProductDetails {
  name?: string;
  description?: string;
  category?: string;
  sellingPrice?: number | null;
  costPrice?: number | null;
  mrp?: number | null;
}

interface GeneratedStudioShot {
  id: string;
  title: string;
  badge: string;
  description: string;
  url: string;
  publicUrl: string;
  prompt: string;
}

export class AiStudioService {
  private mediaService: MediaService;

  constructor() {
    this.mediaService = new MediaService();
  }

  private getGeminiApiKey(): string {
    return (
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_KEY ||
      process.env.GOOGLE_API_KEY ||
      ''
    );
  }

  private getOpenAiApiKey(): string {
    return process.env.OPENAI_API_KEY || '';
  }

  /**
   * Convert file buffer / path into base64 string
   */
  private fileToBase64(file: ReferenceImage): string {
    if (file.buffer) {
      return file.buffer.toString('base64');
    }
    if (file.path && fs.existsSync(file.path)) {
      const fileData = fs.readFileSync(file.path);
      return fileData.toString('base64');
    }
    throw new Error('No valid image data available to convert to base64');
  }

  /**
   * Step 1: Multimodal Vision Analysis (Gemini or OpenAI GPT-4o)
   * Analyzes 1-2 product photos & seller notes to generate 5 dynamic commercial prompts & auto-filled catalog details
   */
  async analyzeProductAndGeneratePrompts(
    images: ReferenceImage[],
    productName?: string,
    category?: string,
    customPrompt?: string
  ): Promise<{ productAnalysis: any; generatedDetails: GeneratedProductDetails; shots: ShotPrompt[] }> {
    const geminiKey = this.getGeminiApiKey();
    const openAiKey = this.getOpenAiApiKey();

    const systemPromptText = `
You are a world-class commercial e-commerce merchandising director and product photographer.
Product Name (if provided): "${productName || ''}"
Category (if provided): "${category || ''}"
Seller Notes / Description: "${customPrompt || ''}"

Analyze the provided reference product image(s) and seller notes:
1. Product identification: physical geometry, materials (e.g. leather, cotton, glass, metal, plastic), colors, branding, features, and use case.
2. Auto-generate complete, professional e-commerce product catalog fields:
   - "name": Clean, compelling, search-optimized product title.
   - "description": High-converting, structured product description highlighting materials, key features, and specifications.
   - "category": Recommended store category.
   - "sellingPrice": Numeric price ONLY if stated or clearly indicated in seller notes/text (e.g. "price 899", "selling for 500", "Rs 800", "₹1200"), otherwise null. DO NOT guess or hallucinate arbitrary prices.
   - "costPrice": Numeric wholesale/cost price ONLY if explicitly stated in seller notes (e.g. "cost 350", "CP 300"), otherwise null.
   - "mrp": Numeric maximum retail price / list price ONLY if stated in seller notes (e.g. "MRP 1499", "tag price 1200"), otherwise null.
3. Formulate 5 distinct commercial studio photoshoot prompts for this EXACT product:
   - "hero": Clean minimalist studio hero shot on a luxury neutral seamless backdrop with soft studio softbox lighting, crisp reflections, soft contact shadows, front 3/4 beauty angle.
   - "lifestyle": High-end contextual lifestyle environment matching this specific product (e.g. if cosmetics -> luxury bathroom counter; if electronics -> oak work desk; if apparel -> model in modern architecture).
   - "detail": Extreme close-up macro shot with shallow depth of field (bokeh), focusing on the finest texture, stitching, craftsmanship, or hardware buttons.
   - "perspective": Dynamic angled isometric perspective showing dimensions, side silhouette, and volume.
   - "editorial": Creative magazine editorial cover shot with dynamic lighting and complementary props.

Respond strictly with valid JSON without markdown formatting:
{
  "productAnalysis": {
    "name": "concise product identification",
    "category": "category identification",
    "materials": ["material 1", "material 2"],
    "colors": ["color 1", "color 2"]
  },
  "generatedDetails": {
    "name": "High-Converting Product Title",
    "description": "Engaging bullet-pointed and formatted e-commerce product description...",
    "category": "Category Name",
    "sellingPrice": null,
    "costPrice": null,
    "mrp": null
  },
  "shots": [
    {
      "id": "hero",
      "title": "Hero Studio Shot",
      "badge": "HERO",
      "description": "Clean minimalist studio shot with softbox lighting & gentle shadows",
      "prompt": "Commercial studio product photography of [detailed product description based on reference image], placed on a sleek minimalist podium, soft diffused studio softbox lighting, subtle reflections, crisp contact shadows, 8k resolution, photorealistic, pristine commercial look"
    },
    {
      "id": "lifestyle",
      "title": "Lifestyle Context",
      "badge": "LIFESTYLE",
      "description": "In-situ environment tailored specifically to this product",
      "prompt": "Commercial lifestyle photography of [detailed product description based on reference image] in [tailored contextual environment], natural cinematic ambient light, shallow depth of field, high-end catalog quality, 8k"
    },
    {
      "id": "detail",
      "title": "Macro & Feature Detail",
      "badge": "DETAIL",
      "description": "Close-up highlighting textures, materials & craftsmanship",
      "prompt": "Macro commercial product photography extreme close-up of [detailed product description based on reference image], highlighting fine texture, stitching and material craftsmanship, soft bokeh background, razor-sharp focus"
    },
    {
      "id": "perspective",
      "title": "Angle & Dimension",
      "badge": "PERSPECTIVE",
      "description": "Dimensional angled perspective showing scale & profile",
      "prompt": "Dynamic angled 45-degree isometric studio product photography of [detailed product description based on reference image], displaying full dimensions and sleek profile, professional studio rim light, soft shadows, 8k"
    },
    {
      "id": "editorial",
      "title": "Creative Editorial",
      "badge": "EDITORIAL",
      "description": "High-fashion artistic staging with complementary aesthetic props",
      "prompt": "Editorial creative commercial product photoshoot of [detailed product description based on reference image], artistic modern composition with harmonious geometric props, dramatic soft lighting, vogue magazine aesthetic, 8k photorealistic"
    }
  ]
}
`;

    // 1. Try Gemini Multimodal Flash models if key exists
    if (geminiKey) {
      const geminiModels = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      for (const model of geminiModels) {
        try {
          const imageParts = images.map((img) => ({
            inlineData: {
              mimeType: img.mimetype || 'image/jpeg',
              data: this.fileToBase64(img),
            },
          }));

          const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
            {
              contents: [
                {
                  role: 'user',
                  parts: [...imageParts, { text: systemPromptText }],
                },
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.4,
              },
            },
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: 30000,
            }
          );

          const candidateText =
            response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleanJson = candidateText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
          const parsed = JSON.parse(cleanJson);

          if (parsed.shots && Array.isArray(parsed.shots) && parsed.shots.length > 0) {
            return {
              productAnalysis: parsed.productAnalysis || {},
              generatedDetails: parsed.generatedDetails || {
                name: productName,
                description: customPrompt,
                category: category,
                sellingPrice: null,
                costPrice: null,
                mrp: null
              },
              shots: parsed.shots,
            };
          }
        } catch (geminiErr: any) {
          console.warn(`[AiStudioService] Gemini ${model} analysis notice:`, geminiErr?.response?.data || geminiErr?.message);
        }
      }
    }

    // 2. Try OpenAI GPT-4o-mini Vision if key exists
    if (openAiKey) {
      try {
        const contentParts: any[] = [{ type: 'text', text: systemPromptText }];
        images.forEach((img) => {
          const b64 = this.fileToBase64(img);
          contentParts.push({
            type: 'image_url',
            image_url: { url: `data:${img.mimetype || 'image/jpeg'};base64,${b64}` },
          });
        });

        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: contentParts }],
            response_format: { type: 'json_object' },
            temperature: 0.4,
          },
          {
            headers: {
              Authorization: `Bearer ${openAiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          }
        );

        const text = response.data?.choices?.[0]?.message?.content || '{}';
        const parsed = JSON.parse(text);
        if (parsed.shots && Array.isArray(parsed.shots) && parsed.shots.length > 0) {
          return {
            productAnalysis: parsed.productAnalysis || {},
            generatedDetails: parsed.generatedDetails || {
              name: productName,
              description: customPrompt,
              category: category,
              sellingPrice: null,
              costPrice: null,
              mrp: null
            },
            shots: parsed.shots,
          };
        }
      } catch (openAiErr: any) {
        console.warn('[AiStudioService] OpenAI prompt analysis notice:', openAiErr?.response?.data || openAiErr?.message);
      }
    }

    return this.getFallbackPrompts(productName, category, customPrompt);
  }

  /**
   * Step 2: Render image using OpenAI Image models (gpt-image-1-mini, gpt-image-1)
   */
  async generateSingleImage(prompt: string, shotId: string): Promise<Buffer | null> {
    const openAiKey = this.getOpenAiApiKey();

    if (openAiKey) {
      const openAiModels = ['gpt-image-1-mini', 'gpt-image-1', 'gpt-image-1.5'];
      for (const model of openAiModels) {
        try {
          const res = await axios.post(
            'https://api.openai.com/v1/images/generations',
            {
              model,
              prompt,
            },
            {
              headers: {
                Authorization: `Bearer ${openAiKey}`,
                'Content-Type': 'application/json',
              },
              timeout: 60000,
            }
          );

          const b64 = res.data?.data?.[0]?.b64_json;
          if (b64) {
            return Buffer.from(b64, 'base64');
          }

          const imgUrl = res.data?.data?.[0]?.url;
          if (imgUrl) {
            const imgRes = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 30000 });
            return Buffer.from(imgRes.data);
          }
        } catch (err: any) {
          console.warn(`[AiStudioService] OpenAI ${model} notice for ${shotId}:`, err?.response?.data?.error?.message || err?.message);
        }
      }
    }

    return null;
  }

  /**
   * Step 3: Progressive Real-Time Streaming Photoshoot Orchestration
   * Streams 5 angle prompts and image outputs in parallel directly as base64 without intermediate R2 uploads
   */
  async runStreamingPhotoshoot(
    userId: string,
    images: ReferenceImage[],
    productName?: string,
    category?: string,
    customPrompt?: string,
    onEvent?: (event: string, data: any) => void
  ): Promise<void> {
    // 1. Vision Analysis & Prompt Planning
    const { productAnalysis, generatedDetails, shots: shotPrompts } = await this.analyzeProductAndGeneratePrompts(
      images,
      productName,
      category,
      customPrompt
    );

    // Emit plan_ready event immediately so client renders individual cards & details
    if (onEvent) {
      onEvent('plan_ready', {
        productAnalysis,
        generatedDetails,
        shots: shotPrompts.map((s) => ({
          id: s.id,
          title: s.title,
          badge: s.badge,
          description: s.description,
          prompt: s.prompt,
        })),
      });
    }

    // 2. Generate all 5 shots in parallel
    let completedCount = 0;
    const tasks = shotPrompts.map(async (shot) => {
      try {
        const imageBuffer = await this.generateSingleImage(shot.prompt, shot.id);

        if (imageBuffer) {
          completedCount++;
          const base64Data = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

          if (onEvent) {
            onEvent('shot_complete', {
              id: shot.id,
              title: shot.title,
              badge: shot.badge,
              description: shot.description,
              base64: base64Data,
              prompt: shot.prompt,
              completedCount,
              totalCount: shotPrompts.length,
            });
          }
          return { id: shot.id, success: true };
        } else {
          if (onEvent) {
            onEvent('shot_error', {
              id: shot.id,
              error: 'Failed to render image',
            });
          }
        }
      } catch (err: any) {
        console.error(`[AiStudioService] Error generating shot ${shot.id}:`, err?.message || err);
        if (onEvent) {
          onEvent('shot_error', {
            id: shot.id,
            error: err?.message || 'Generation failed',
          });
        }
      }
      return { id: shot.id, success: false };
    });

    await Promise.allSettled(tasks);

    if (onEvent) {
      onEvent('done', {
        success: completedCount > 0,
        totalCompleted: completedCount,
        totalRequested: shotPrompts.length,
      });
    }
  }

  /**
   * Step 4: Fallback Non-Streaming End-to-End Photoshoot Orchestration
   */
  async runPhotoshoot(
    userId: string,
    images: ReferenceImage[],
    productName?: string,
    category?: string,
    customPrompt?: string
  ): Promise<{ success: boolean; productAnalysis: any; generatedDetails?: GeneratedProductDetails; shots: GeneratedStudioShot[] }> {
    const { productAnalysis, generatedDetails, shots: shotPrompts } = await this.analyzeProductAndGeneratePrompts(
      images,
      productName,
      category,
      customPrompt
    );

    const generatedShots: GeneratedStudioShot[] = [];

    const generationTasks = shotPrompts.map(async (shot) => {
      try {
        const imageBuffer = await this.generateSingleImage(shot.prompt, shot.id);

        if (imageBuffer) {
          const uploadResult = await this.mediaService.uploadFile(userId, {
            originalname: `ai-studio-${shot.id}-${Date.now()}.jpg`,
            buffer: imageBuffer,
            mimetype: 'image/jpeg',
          });

          return {
            id: shot.id,
            title: shot.title,
            badge: shot.badge,
            description: shot.description,
            url: uploadResult.url,
            publicUrl: uploadResult.publicUrl,
            prompt: shot.prompt,
          };
        }
      } catch (err: any) {
        console.error(`[AiStudioService] Failed generating shot ${shot.id}:`, err?.message || err);
      }
      return null;
    });

    const results = await Promise.all(generationTasks);
    results.forEach((res) => {
      if (res) generatedShots.push(res);
    });

    if (generatedShots.length > 0) {
      return {
        success: true,
        productAnalysis,
        generatedDetails,
        shots: generatedShots,
      };
    }

    return {
      success: false,
      productAnalysis,
      generatedDetails,
      shots: [],
    };
  }

  private getFallbackPrompts(productName?: string, category?: string, customPrompt?: string) {
    const item = productName || 'Product';
    const cat = category || 'Retail Item';
    const style = customPrompt ? `, styled with: ${customPrompt}` : '';

    return {
      productAnalysis: {
        name: item,
        category: cat,
        materials: ['Commercial Quality Materials'],
        colors: ['Original Product Colors'],
        description: `Studio photoshoot for ${item} in ${cat} category`,
      },
      generatedDetails: {
        name: item !== 'Product' ? item : undefined,
        description: customPrompt || undefined,
        category: cat !== 'Retail Item' ? cat : undefined,
        sellingPrice: null,
        costPrice: null,
        mrp: null
      },
      shots: [
        {
          id: 'hero',
          title: 'Hero Studio Shot',
          badge: 'HERO',
          description: 'Clean minimalist studio shot with softbox lighting & gentle shadows',
          prompt: `Commercial studio hero product photography of ${item} (${cat}), minimalist seamless studio pedestal, soft 3-point softbox studio lighting, crisp reflections, soft contact shadow, 8k photorealistic${style}`,
        },
        {
          id: 'lifestyle',
          title: 'Lifestyle Context',
          badge: 'LIFESTYLE',
          description: 'In-situ environment tailored specifically to this product',
          prompt: `Lifestyle catalog commercial photography of ${item} placed in an authentic modern aesthetic environment, warm natural cinematic lighting, shallow depth of field, 8k${style}`,
        },
        {
          id: 'detail',
          title: 'Macro & Feature Detail',
          badge: 'DETAIL',
          description: 'Close-up highlighting textures, materials & craftsmanship',
          prompt: `Macro extreme close-up product photography of ${item}, focusing on fine textures, premium finish and craftsmanship, luxury commercial lighting, soft bokeh, 8k${style}`,
        },
        {
          id: 'perspective',
          title: 'Angle & Dimension',
          badge: 'PERSPECTIVE',
          description: 'Dimensional angled perspective showing scale & profile',
          prompt: `Dynamic 45-degree angled perspective studio product photography of ${item}, displaying dimensional scale and elegant side silhouette, studio rim light, soft shadows, 8k${style}`,
        },
        {
          id: 'editorial',
          title: 'Creative Editorial',
          badge: 'EDITORIAL',
          description: 'High-fashion artistic staging with complementary aesthetic props',
          prompt: `Creative editorial magazine photoshoot of ${item}, modern artistic styling with aesthetic geometry and complementary color palette, high fashion commercial photography, 8k${style}`,
        },
      ],
    };
  }
}
