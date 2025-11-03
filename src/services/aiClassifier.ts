import { pipeline, env } from '@huggingface/transformers';

// Configure to use local models (will download on first use)
env.allowLocalModels = false;
env.allowRemoteModels = true;

// Cache the pipeline instance
let classifier: any = null;

/**
 * Initialize the image classification pipeline
 * Downloads the model on first use (cached in browser)
 */
async function getClassifier() {
  if (!classifier) {
    console.log('Loading AI model... (first time only)');
    
    // Using a lightweight waste/recycling classification model
    // Alternative models you can try:
    // - 'Xenova/vit-base-patch16-224' (general purpose)
    // - 'Xenova/mobilenet-v2' (very fast, mobile-friendly)
    classifier = await pipeline(
      'image-classification',
      'Xenova/vit-base-patch16-224' // General image classifier
    );
    
    console.log('AI model loaded successfully!');
  }
  return classifier;
}

/**
 * Classify waste image using browser-based AI
 * @param imageFile - The image file to classify
 * @returns Classification result with label and confidence
 */
export async function classifyWasteImage(imageFile: File): Promise<{
  label: string;
  confidence: number;
  allPredictions: Array<{ label: string; score: number }>;
}> {
  try {
    // Get the classifier (will download model on first use)
    const model = await getClassifier();
    
    // Create image URL for the model
    const imageUrl = URL.createObjectURL(imageFile);
    
    // Perform classification
    const results = await model(imageUrl);
    
    // Clean up the object URL
    URL.revokeObjectURL(imageUrl);
    
    // Map generic labels to waste categories
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

/**
 * Map generic ImageNet labels to waste categories
 */
function mapToWasteCategory(prediction: { label: string; score: number }): {
  label: string;
  score: number;
} {
  const label = prediction.label.toLowerCase();
  
  // Mapping common objects to waste categories
  const wasteMapping: Record<string, string> = {
    // Plastic items
    'water bottle': 'Plastic',
    'bottle': 'Plastic', 
    'plastic bag': 'Plastic',
    'container': 'Plastic',
    'cup': 'Plastic',
    'strainer': 'Plastic',
    'pitcher': 'Plastic',
    
    // Paper items
    'envelope': 'Paper',
    'notebook': 'Paper',
    'book': 'Paper',
    'magazine': 'Paper',
    'carton': 'Cardboard',
    'box': 'Cardboard',
    'packet': 'Paper',
    
    // Metal items
    'can': 'Metal',
    'beer bottle': 'Glass',
    'wine bottle': 'Glass',
    'pop bottle': 'Plastic',
    
    // Organic
    'banana': 'Organic',
    'orange': 'Organic',
    'apple': 'Organic',
    'lemon': 'Organic',
    'corn': 'Organic',
    'plate': 'Organic',
    'mushroom': 'Organic',
    
    // Glass
    'jar': 'Glass',
    'jug': 'Glass',
    'vase': 'Glass',
    
    // E-waste
    'cellular telephone': 'E-waste',
    'ipod': 'E-waste',
    'laptop': 'E-waste',
    'mouse': 'E-waste',
    'remote control': 'E-waste',
    'screen': 'E-waste',
  };
  
  // Check for keyword matches
  for (const [keyword, category] of Object.entries(wasteMapping)) {
    if (label.includes(keyword)) {
      return { label: category, score: prediction.score };
    }
  }
  
  // Default to general waste if no match
  return { label: 'General', score: prediction.score * 0.7 };
}

/**
 * Check if the model is ready or needs downloading
 */
export function isModelReady(): boolean {
  return classifier !== null;
}
