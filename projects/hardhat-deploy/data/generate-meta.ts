/**
 * generate1000Files.ts
 *
 * Usage (with ts-node):
 *    ts-node generate1000Files.ts
 *
 * This script:
 * 1. Reads three JSON template files: cat1.json, cat2.json, cat3.json.
 * 2. Generates 1000 output files by randomly picking one of the templates for each file.
 * 3. For each output file, it deep-clones the selected template and adds a "type" attribute.
 *    The "type" attribute is formatted as "<templateBaseName>#<counter>".
 * 4. Writes the new JSON objects into the "metadat" folder as "1.json", "2.json", ..., "1000.json".
 */

import * as fs from 'fs';
import * as path from 'path';

async function main() {
  // Define the template files
  const templates = ['cat1.json', 'cat2.json', 'cat3.json'];

  // Object to hold the parsed JSON content of each template
  const templatesData: { [template: string]: any } = {};

  // Pre-read and parse each template file
  for (const template of templates) {
    const templatePath = path.resolve(__dirname, template);
    if (!fs.existsSync(templatePath)) {
      console.error(`Template file not found: ${templatePath}`);
      process.exit(1);
    }
    try {
      const data = fs.readFileSync(templatePath, 'utf-8');
      templatesData[template] = JSON.parse(data);
    } catch (error) {
      console.error(`Error reading or parsing ${template}:`, error);
      process.exit(1);
    }
  }

  // Initialize a counter for each template (using the base filename, e.g., "cat1")
  const counters: { [baseName: string]: number } = {};
  for (const template of templates) {
    const baseName = path.basename(template, '.json');
    counters[baseName] = 0;
  }

  // Ensure the "metadat" folder exists
  const outputFolder = path.resolve(__dirname, 'metadata');
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder);
  }

  // Generate 1000 files by randomly choosing one of the 3 templates each time
  for (let i = 1; i <= 1000; i++) {
    // Randomly select a template file
    const chosenTemplate = templates[Math.floor(Math.random() * templates.length)];
    const baseName = path.basename(chosenTemplate, '.json');

    // Increment the counter for this specific template
    counters[baseName]++;

    // Create a deep clone of the template content
    const newData = JSON.parse(JSON.stringify(templatesData[chosenTemplate]));

    // Add a "type" attribute in the format "<templateBaseName>#<counter>"
    newData.name = `${newData.name} #${counters[baseName]}`;

    // Define the output file path (e.g., metadat/1.json, metadat/2.json, ...)
    const outputFilePath = path.join(outputFolder, `${i}.json`);

    // Write the new JSON object to the output file
    try {
      fs.writeFileSync(outputFilePath, JSON.stringify(newData, null, 2), 'utf-8');
      console.log(`Created ${outputFilePath} with type: ${newData.type}`);
    } catch (error) {
      console.error(`Error writing file ${outputFilePath}:`, error);
    }
  }
}

main().catch((err) => {
  console.error('An error occurred:', err);
  process.exit(1);
});
