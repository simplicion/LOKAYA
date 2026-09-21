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

  private getApiKey(): string {
    return (
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_AI_KEY ||
      process.env.GOOGLE_API_KEY ||
      ''
    );
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
   * Step 1: Multimodal Vision Analysis with Gemini 2.0 Flash
   * Analyzes 1-2 product photos & generates 5 dynamic commercial prompts
   */
  async analyzeProductAndGeneratePrompts(
    images: ReferenceImage[],
    productName?: string,
    category?: string,
    customPrompt?: string
  ): Promise<{ productAnalysis: any; shots: ShotPrompt[] }> {
    const apiKey = this.getApiKey();

    if (!apiKey) {
      console.warn('[AiStudioService] GEMINI_API_KEY not configured. Using fallback dynamic studio prompts.');
      return this.getFallbackPrompts(productName, category, customPrompt);
    }

    try {
      const imageParts = images.map((img) => ({
        inlineData: {
          mimeType: img.mimetype || 'image/jpeg',
          data: this.fileToBase64(img),
        },
      }));

      const contextText = `
You are a world-class commercial product photographer, 3D visual effects director, and high-end advertising creative director for luxury retail and e-commerce.
Product Name: "${productName || 'Product'}"
Product Category: "${category || 'General'}"
${customPrompt ? `Seller custom direction: "${customPrompt}"` : ''}

Analyze the provided reference product image(s). Identify:
1. Product type, physical geometry, and exact design elements.
2. Key materials (e.g. brushed aluminum, glossy glass, premium matte polymer, genuine leather, textured canvas, organic cotton, ceramic).
3. Primary and secondary color palette, logos, and label placement.
4. Natural commercial staging contexts.

Generate 5 distinct, photorealistic commercial product photoshoot prompts designed to present THIS EXACT product in studio excellence:
1. "hero": Clean minimalist studio hero shot on a luxury neutral seamless backdrop with soft studio softbox lighting, crisp reflections, soft contact shadows, front 3/4 beauty angle.
2. "lifestyle": High-end contextual lifestyle environment matching this specific product (e.g. if cosmetics -> luxury spa marble countertop with soft botanicals; if electronics -> sleek oak desk with warm ambient lamp; if apparel/shoes -> aesthetic modern architecture; if food/spice -> gourmet kitchen).
3. "detail": Extreme close-up macro shot with shallow depth of field (bokeh), focusing on the finest texture, stitching, craftsmanship, or hardware buttons.
4. "perspective": Dynamic angled isometric perspective showing dimensions, side silhouette, and volume.
5. "editorial": Creative magazine editorial cover shot with dynamic colored rim lighting, artistic props, and high-fashion aesthetics.

${customPrompt ? `Important: Strictly blend the seller's custom style: "${customPrompt}".` : ''}

Respond strictly with valid JSON without markdown formatting:
{
  "productAnalysis": {
    "name": "${productName || 'Product'}",
    "category": "${category || 'General'}",
    "materials": ["identified material 1", "identified material 2"],
    "colors": ["identified color 1", "identified color 2"],
    "description": "concise description of the product"
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

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              role: 'user',
              parts: [...imageParts, { text: contextText }],
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
        return parsed;
      }
      return this.getFallbackPrompts(productName, category, customPrompt);
    } catch (error: any) {
      console.error('[AiStudioService] Gemini vision prompt generation error:', error?.response?.data || error?.message || error);
      return this.getFallbackPrompts(productName, category, customPrompt);
    }
  }

  /**
   * Step 2: Render a single image with Imagen 3 / Google GenAI Image API
   */
  async generateSingleImage(prompt: string, shotId: string): Promise<Buffer | null> {
    const apiKey = this.getApiKey();
    if (!apiKey) return null;

    // Try Imagen 3 predict endpoint
    try {
      const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
      const payload = {
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: '1:1',
          outputMimeType: 'image/jpeg',
          personGeneration: 'ALLOW_ADULT',
          safetySetting: 'BLOCK_ONLY_HIGH',
        },
      };

      const res = await axios.post(imagenUrl, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 45000,
      });

      const b64 =
        res.data?.predictions?.[0]?.bytesBase64Encoded ||
        res.data?.generatedImages?.[0]?.image?.imageBytes;

      if (b64) {
        return Buffer.from(b64, 'base64');
      }
    } catch (err: any) {
      console.warn(`[AiStudioService] Imagen 3 predict call for ${shotId} error:`, err?.response?.data || err?.message || err);
    }

    // Try alternative endpoint format
    try {
      const altUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key=${apiKey}`;
      const res = await axios.post(
        altUrl,
        {
          prompt,
          numberOfImages: 1,
          aspectRatio: '1:1',
          outputMimeType: 'image/jpeg',
        },
        { headers: { 'Content-Type': 'application/json' }, timeout: 45000 }
      );

      const b64 =
        res.data?.generatedImages?.[0]?.image?.imageBytes ||
        res.data?.predictions?.[0]?.bytesBase64Encoded;

      if (b64) {
        return Buffer.from(b64, 'base64');
      }
    } catch (altErr: any) {
      console.warn(`[AiStudioService] Alt Imagen endpoint for ${shotId} error:`, altErr?.response?.data || altErr?.message || altErr);
    }

    return null;
  }

  /**
   * Step 3: End-to-End Photoshoot Orchestration
   * Analyzes reference photos -> Generates 5 Studio Shots -> Uploads to Storage -> Returns results
   */
  async runPhotoshoot(
    userId: string,
    images: ReferenceImage[],
    productName?: string,
    category?: string,
    customPrompt?: string
  ): Promise<{ success: boolean; productAnalysis: any; shots: GeneratedStudioShot[] }> {
    // 1. Analyze and craft prompts
    const { productAnalysis, shots: shotPrompts } = await this.analyzeProductAndGeneratePrompts(
      images,
      productName,
      category,
      customPrompt
    );

    // 2. Generate all 5 shots concurrently
    const generatedShots: GeneratedStudioShot[] = [];

    const generationTasks = shotPrompts.map(async (shot) => {
      try {
        const imageBuffer = await this.generateSingleImage(shot.prompt, shot.id);

        if (imageBuffer) {
          // Upload to R2 / S3
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

    // If API key generated results, return them!
    if (generatedShots.length > 0) {
      return {
        success: true,
        productAnalysis,
        shots: generatedShots,
      };
    }

    // Fallback: If no API key is yet configured, inform frontend gracefully
    return {
      success: false,
      productAnalysis,
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
