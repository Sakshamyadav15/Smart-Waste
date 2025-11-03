import { pipeline, env } from '@huggingface/transformers';

env.allowLocalModels = false;
env.allowRemoteModels = true;

let classifier: any = null;

async function getClassifier() {
  if (!classifier) {
    console.log('Loading AI model... (first time only)');

    classifier = await pipeline(
      'image-classification',
      'Xenova/vit-base-patch16-224' 
    );
    
    console.log('AI model loaded successfully!');
  }
  return classifier;
}

export async function classifyWasteImage(imageFile: File): Promise<{
  label: string;
  confidence: number;
  allPredictions: Array<{ label: string; score: number }>;
}> {
  try {
    
    const model = await getClassifier();

    const imageUrl = URL.createObjectURL(imageFile);

    const results = await model(imageUrl);

    URL.revokeObjectURL(imageUrl);

    const mappedResult = mapToWasteCategory(results[0]);
    
    return {
      label: mappedResult.label,
      confidence: mappedResult.score,
      allPredictions: results.slice(0, 5).map((r: any) => ({
        label: r.label,
        score: r.score
      }))
    };
  } catch (error) {
    console.error('Classification error:', error);
    throw new Error('Failed to classify image. Please try again.');
  }
}

function mapToWasteCategory(prediction: { label: string; score: number }): {
  label: string;
  score: number;
} {
  const label = prediction.label.toLowerCase();

  const wasteMapping: Record<string, string> = {
    
    'water bottle': 'Plastic',
    'bottle': 'Plastic', 
    'plastic bag': 'Plastic',
    'container': 'Plastic',
    'cup': 'Plastic',
    'strainer': 'Plastic',
    'pitcher': 'Plastic',

    'envelope': 'Paper',
    'notebook': 'Paper',
    'book': 'Paper',
    'magazine': 'Paper',
    'carton': 'Cardboard',
    'box': 'Cardboard',
    'packet': 'Paper',

    'can': 'Metal',
    'beer bottle': 'Glass',
    'wine bottle': 'Glass',
    'pop bottle': 'Plastic',

    'banana': 'Organic',
    'orange': 'Organic',
    'apple': 'Organic',
    'lemon': 'Organic',
    'corn': 'Organic',
    'plate': 'Organic',
    'mushroom': 'Organic',

    'jar': 'Glass',
    'jug': 'Glass',
    'vase': 'Glass',

    'cellular telephone': 'E-waste',
    'ipod': 'E-waste',
    'laptop': 'E-waste',
    'mouse': 'E-waste',
    'remote control': 'E-waste',
    'screen': 'E-waste',
  };

  for (const [keyword, category] of Object.entries(wasteMapping)) {
    if (label.includes(keyword)) {
      return { label: category, score: prediction.score };
    }
  }

  return { label: 'General', score: prediction.score * 0.7 };
}

export function isModelReady(): boolean {
  return classifier !== null;
}
