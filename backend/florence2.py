
import requests

from PIL import Image
from transformers import AutoProcessor, AutoModelForCausalLM, AutoTokenizer

# Load the processor
processor = AutoProcessor.from_pretrained("microsoft/Florence-2-large",trust_remote_code=True)

# Load the model without flash attention
model = AutoModelForCausalLM.from_pretrained("microsoft/Florence-2-large", trust_remote_code=True, use_flash_attention_2=False, use_falcon_attention=False)

# Load the tokenizer (if needed separately)
tokenizer = AutoTokenizer.from_pretrained("microsoft/Florence-2-large")

url = "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/transformers/tasks/car.jpg?download=true"
image = Image.open(requests.get(url, stream=True).raw)

def run_example(task_prompt, text_input=None):
    if text_input is None:
        prompt = task_prompt
    else:
        prompt = task_prompt + text_input
    inputs = processor(text=prompt, images=image, return_tensors="pt")
    generated_ids = model.generate(
      input_ids=inputs["input_ids"],
      pixel_values=inputs["pixel_values"],
      max_new_tokens=1024,
      num_beams=3
    )
    generated_text = processor.batch_decode(generated_ids, skip_special_tokens=False)[0]

    parsed_answer = processor.post_process_generation(generated_text, task=task_prompt, image_size=(image.width, image.height))

    print(parsed_answer)