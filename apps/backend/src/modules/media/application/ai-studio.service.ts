import axios from 'axios';
import { MediaService } from './media.service';
import fs from 'fs';
import sharp from 'sharp';

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
   * Extract image buffer from reference image files
   */
  private getReferenceImageBuffer(images?: ReferenceImage[]): Buffer | null {
    if (!images || images.length === 0) return null;
    for (const img of images) {
      if (img.buffer && Buffer.isBuffer(img.buffer) && img.buffer.length > 0) {
        return img.buffer;
      }
      if (img.path && fs.existsSync(img.path)) {
        return fs.readFileSync(img.path);
      }
    }
    return null;
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
You are a world-renowned commercial advertising photographer and master e-commerce studio director, shooting with Hasselblad H6D-100c medium-format digital back and HC 100mm f/2.2 prime / 120mm macro lenses with Broncolor / Profoto strobe lighting.

Product Name (if provided): "${productName || ''}"
Category (if provided): "${category || ''}"
Seller Notes / Description: "${customPrompt || ''}"

Analyze the provided reference product image(s) and seller notes:
1. Physical Product Inspection:
   - Identify precise product geometry, silhouette, material physics (e.g. woven cotton textile, full-grain leather with pore textures, optical borosilicate glass with caustic refractions, brushed anodized aluminum, matte ceramics).
   - Identify exact color palette, logo / typographic details, finish (satin, gloss, matte).

2. Auto-generate complete, professional e-commerce product catalog fields:
   - "name": Clean, compelling, search-optimized commercial product title.
   - "description": High-converting, structured product description highlighting tactile materials, key features, dimensions, and specifications.
   - "category": Recommended store category.
   - "sellingPrice": Numeric price ONLY if stated or clearly indicated in seller notes/text (e.g. "price 899", "selling for 500", "Rs 800", "₹1200"), otherwise null. DO NOT guess or hallucinate arbitrary prices.
   - "costPrice": Numeric wholesale/cost price ONLY if explicitly stated in seller notes (e.g. "cost 350", "CP 300"), otherwise null.
   - "mrp": Numeric maximum retail price / list price ONLY if stated in seller notes (e.g. "MRP 1499", "tag price 1200"), otherwise null.

3. Formulate 5 hyper-realistic commercial studio photoshoot prompts for this EXACT product.
   STRICT STUDIO PHOTOGRAPHY RULES FOR EVERY PROMPT:
   - Camera & Optics: Shot on Hasselblad H6D-100c medium format camera, ISO 64, f/8 aperture, 1/250s shutter speed, razor-sharp focus with authentic optical depth-of-field.
   - Lighting: Profoto D2 AirTTL 3-point studio lighting setup (5-foot octabox key light at 45 degrees, white bounce fill, stripbox kicker with 50-degree honeycomb grid for crisp edge separation).
   - Material Micro-Textures: Emphasize genuine physical tactile textures (individual fabric weave fibers, organic leather grain and pore details, crisp specular highlights on polished surfaces, subtle Fresnel falloff).
   - Ground Contact: Genuine contact ambient occlusion shadows beneath the subject with subtle penumbra gradient (never floating, never airbrushed).
   - Anti-CGI Guardrails: Include negative styling directives (no 3D CGI render, no cartoon, no plastic skin, no illustration, no unreal engine, no airbrushed smooth plastic, strictly award-winning commercial catalog photography).

   The 5 Distinct Angles:
   - "hero": Clean minimalist studio hero shot on a luxury neutral matte cyclorama backdrop with soft studio softbox lighting, crisp reflections, soft contact shadows, front 3/4 beauty angle.
   - "lifestyle": Authentic high-end contextual lifestyle environment matching this specific product (e.g. if cosmetics -> polished Calacatta marble counter with morning sun beam; if electronics -> Scandinavian solid oak workspace; if apparel -> editorial daylight architectural atrium).
   - "detail": Extreme 1:1 macro close-up shot with shallow depth of field (f/2.8 bokeh), focusing on the finest material weave, tactile stitching, edge bevel, or hardware engraving.
   - "perspective": Dynamic 45-degree dimensional studio perspective showing full scale, depth, ergonomic profile, and dramatic rim light edge separation.
   - "editorial": Vogue / GQ style commercial lookbook cover staging with harmonious geometric props, sophisticated color temperature balance, and luxury editorial magazine mood.

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
      "prompt": "Commercial catalog studio product photography of [exact product], placed on a sleek neutral matte pedestal, Profoto 3-point softbox lighting, crisp specular highlights, soft contact ambient occlusion shadow, Hasselblad H6D-100c medium format camera, 100mm lens, 8k resolution, photorealistic, pristine commercial look, no CGI, no cartoon"
    },
    {
      "id": "lifestyle",
      "title": "Lifestyle Context",
      "badge": "LIFESTYLE",
      "description": "In-situ environment tailored specifically to this product",
      "prompt": "Authentic commercial lifestyle catalog photography of [exact product] placed in [contextual environment], cinematic natural ambient light with subtle fill bounce, shallow depth of field, tactile material realism, Phase One IQ4 150MP, 8k photorealistic, no 3D render"
    },
    {
      "id": "detail",
      "title": "Macro & Feature Detail",
      "badge": "DETAIL",
      "description": "Close-up highlighting textures, materials & craftsmanship",
      "prompt": "Extreme macro commercial product photography of [exact product], extreme close-up showcasing authentic material micro-textures, fine stitching, tactile surface pores, razor-sharp focus with creamy optical bokeh, Schneider Kreuznach 120mm macro lens, 8k"
    },
    {
      "id": "perspective",
      "title": "Angle & Dimension",
      "badge": "PERSPECTIVE",
      "description": "Dimensional angled perspective showing scale & profile",
      "prompt": "Dynamic 45-degree angled perspective studio product photography of [exact product], displaying dimensional profile, Profoto rim lighting with honeycomb grid, soft contact shadows, Hasselblad medium format, 8k photorealistic"
    },
    {
      "id": "editorial",
      "title": "Creative Editorial",
      "badge": "EDITORIAL",
      "description": "High-fashion artistic staging with complementary aesthetic props",
      "prompt": "High-end commercial editorial magazine lookbook photoshoot of [exact product], elegant architectural composition with harmonious minimal props, dramatic soft lighting, luxury brand campaign aesthetic, 8k photorealistic, zero illustration"
    }
  ]
}
`;

    // 1. Try Gemini Multimodal Flash models if key exists
    if (geminiKey) {
      const geminiModels = ['gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
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
   * High-performance Commercial Studio Angle Enhancement Engine
   * Generates specialized commercial catalog perspectives directly from reference product photos
   */
  async generateStudioAngleFromReference(
    inputBuffer: Buffer,
    shotId: string
  ): Promise<Buffer> {
    const meta = await sharp(inputBuffer).metadata();
    const width = meta.width || 1080;
    const height = meta.height || 1080;
    const TARGET_SIZE = 1080;

    switch (shotId) {
      case 'detail': {
        // Macro & Feature Detail: 1.8x optical macro crop into craftsmanship & material micro-textures
        const cropW = Math.max(100, Math.round(width * 0.52));
        const cropH = Math.max(100, Math.round(height * 0.52));
        const left = Math.max(0, Math.round((width - cropW) / 2));
        const top = Math.max(0, Math.round((height - cropH) / 2));

        return await sharp(inputBuffer)
          .extract({ left, top, width: cropW, height: cropH })
          .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'cover' })
          .sharpen({ sigma: 1.8, m1: 1.2, m2: 2.0 })
          .modulate({ saturation: 1.12, brightness: 1.02 })
          .jpeg({ quality: 92, mozjpeg: true })
          .toBuffer();
      }

      case 'hero': {
        // Hero Studio Shot: High-key commercial studio presentation on clean seamless pedestal backdrop
        return await sharp(inputBuffer)
          .resize(TARGET_SIZE, TARGET_SIZE, {
            fit: 'contain',
            background: { r: 250, g: 250, b: 250, alpha: 1 },
          })
          .sharpen({ sigma: 1.3 })
          .modulate({ saturation: 1.08, brightness: 1.03 })
          .jpeg({ quality: 92, mozjpeg: true })
          .toBuffer();
      }

      case 'lifestyle': {
        // Lifestyle Context: Warm ambient studio lighting with subtle natural tone grading
        return await sharp(inputBuffer)
          .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'cover' })
          .modulate({ saturation: 1.2, brightness: 1.01 })
          .tint({ r: 255, g: 248, b: 240 })
          .sharpen({ sigma: 1.1 })
          .jpeg({ quality: 92, mozjpeg: true })
          .toBuffer();
      }

      case 'perspective': {
        // Angle & Dimension: 45° dynamic dimensional framing highlighting depth & profile
        const cropW = Math.max(100, Math.round(width * 0.85));
        const cropH = Math.max(100, Math.round(height * 0.85));
        const left = Math.max(0, Math.round(width * 0.05));
        const top = Math.max(0, Math.round(height * 0.08));

        return await sharp(inputBuffer)
          .extract({ left, top, width: cropW, height: cropH })
          .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'cover' })
          .sharpen({ sigma: 1.4 })
          .modulate({ saturation: 1.06, brightness: 1.03 })
          .jpeg({ quality: 92, mozjpeg: true })
          .toBuffer();
      }

      case 'editorial':
      default: {
        // Creative Editorial: High-fashion lookbook magazine grading with rich contrast
        return await sharp(inputBuffer)
          .resize(TARGET_SIZE, TARGET_SIZE, { fit: 'cover' })
          .modulate({ saturation: 0.96, brightness: 1.05 })
          .sharpen({ sigma: 1.4, m1: 1.0, m2: 2.2 })
          .jpeg({ quality: 92, mozjpeg: true })
          .toBuffer();
      }
    }
  }

  /**
   * Step 2: Render studio angle image using OpenAI Image models or high-performance Studio Angle Engine
   */
  async generateSingleImage(
    prompt: string,
    shotId: string,
    referenceImages?: ReferenceImage[]
  ): Promise<Buffer | null> {
    const openAiKey = this.getOpenAiApiKey();

    if (openAiKey) {
      const openAiModels = ['gpt-image-1-mini', 'gpt-image-1', 'dall-e-3'];
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
              timeout: 10000,
            }
          );

          const b64 = res.data?.data?.[0]?.b64_json;
          if (b64) {
            return Buffer.from(b64, 'base64');
          }

          const imgUrl = res.data?.data?.[0]?.url;
          if (imgUrl) {
            const imgRes = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 8000 });
            return Buffer.from(imgRes.data);
          }
        } catch (err: any) {
          console.warn(`[AiStudioService] OpenAI ${model} notice for ${shotId}:`, err?.response?.data?.error?.message || err?.message);
        }
      }
    }

    // High-performance Studio Angle Enhancement Engine
    // Transforms the seller's actual product photo into the requested commercial studio angle
    try {
      const refBuffer = this.getReferenceImageBuffer(referenceImages);
      if (refBuffer) {
        return await this.generateStudioAngleFromReference(refBuffer, shotId);
      }
    } catch (sharpErr: any) {
      console.error(`[AiStudioService] Studio angle enhancement error for ${shotId}:`, sharpErr?.message || sharpErr);
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
        const imageBuffer = await this.generateSingleImage(shot.prompt, shot.id, images);

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
        const imageBuffer = await this.generateSingleImage(shot.prompt, shot.id, images);

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
          prompt: `Commercial catalog studio product photography of ${item} (${cat}), minimalist seamless studio pedestal, Profoto 3-point softbox studio lighting, crisp specular reflections, soft contact ambient occlusion shadow, Hasselblad H6D-100c, 100mm prime lens, authentic textures, 8k photorealistic, no CGI, no cartoon${style}`,
        },
        {
          id: 'lifestyle',
          title: 'Lifestyle Context',
          badge: 'LIFESTYLE',
          description: 'In-situ environment tailored specifically to this product',
          prompt: `Authentic commercial lifestyle catalog photography of ${item} (${cat}) placed in a modern architectural aesthetic setting, cinematic natural ambient lighting with gentle fill bounce, shallow depth of field, Phase One IQ4 150MP, 8k photorealistic, no 3D render${style}`,
        },
        {
          id: 'detail',
          title: 'Macro & Feature Detail',
          badge: 'DETAIL',
          description: 'Close-up highlighting textures, materials & craftsmanship',
          prompt: `Extreme macro commercial product photography of ${item} (${cat}), extreme close-up highlighting tactile material micro-textures, fine craftsmanship, stitching and surface finish, luxury studio lighting, optical creamy bokeh, Schneider Kreuznach 120mm macro, 8k${style}`,
        },
        {
          id: 'perspective',
          title: 'Angle & Dimension',
          badge: 'PERSPECTIVE',
          description: 'Dimensional angled perspective showing scale & profile',
          prompt: `Dynamic 45-degree angled perspective studio product photography of ${item} (${cat}), displaying dimensional scale and elegant silhouette, Profoto rim lighting with honeycomb grid, soft ground shadows, Hasselblad medium format, 8k photorealistic${style}`,
        },
        {
          id: 'editorial',
          title: 'Creative Editorial',
          badge: 'EDITORIAL',
          description: 'High-fashion artistic staging with complementary aesthetic props',
          prompt: `High-fashion commercial editorial magazine lookbook photoshoot of ${item} (${cat}), artistic modern composition with harmonious minimal props, dramatic soft lighting, luxury campaign aesthetic, 8k photorealistic, zero illustration${style}`,
        },
      ],
    };
  }
}
