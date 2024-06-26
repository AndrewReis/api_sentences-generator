import express           from 'express';
import OpenAI            from 'openai';
import { writeFile }     from 'node:fs/promises';
import { dirname }       from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const app 			 = express();

app.use(express.json());

// const ankiConnectRequest = async (action, params = {}) => {
//   try {
//     const response = await axios.post('http://localhost:8765', {
//       action,
//       version: 6,
//       params,
//     });
//     return response.data;
//   } catch (error) {
//     console.error('Error connecting to AnkiConnect:', error);
//     throw error;
//   }
// };

// const deckName = "NODEJS";
// const phrases = [
//   "Hello, how are you?",
//   "This is a test phrase.",
//   "The quick brown fox jumps over the lazy dog.",
//   "She sells sea shells by the sea shore."
// ];

// const isEnglish = (text) => {
//   return /^[a-zA-Z0-9.,'?! ]*$/.test(text);
// };

// app.post('/addPhrases', async (req, res) => {
//   try {
//     for (const phrase of phrases) {
//       if (isEnglish(phrase)) {
//         const fields = {
//           Front: phrase,
//           Back: ''
//         };

//         await ankiConnectRequest('addNote', {
//           note: {
//             deckName,
//             modelName: "Basic",
//             fields,
//             tags: []
//           }
//         });
//       }
//     }
//     res.send('Phrases added to Anki');
//   } catch (error) {
//     res.status(500).send('Failed to add phrases to Anki');
//   }
// });

// async function addAnki() {
//   try {
//     for (const phrase of phrases) {
//       if (isEnglish(phrase)) {
//         const fields = {
//           Front: phrase,
//           Back: ''
//         };

//         await ankiConnectRequest('addNote', {
//           note: {
//             deckName,
//             modelName: "Basic",
//             fields,
//             tags: []
//           }
//         });
//       }
//     }
//     res.send('Phrases added to Anki');
//   } catch (error) {
//     res.status(500).send('Failed to add phrases to Anki');
//   }
// }

// addAnki().then(() => console.log('Success')).catch(err => console.log(err))

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY
});

function getInstruction(text = '') {
	return `
	Atue como um especialista em Inglês e apartir de um texto de entrada extraia suas palavras e com essas palavras extraidas
	gere novas frases em inglês.
	As novas frases devem ter estes contextos: Entrevista de emprego, comunicação em um aeroporto, apresentação em uma reunião da empresa, conversa no bar com amigos.

	Você vai usar o texto de entrada apenas para extrair as palavras, você não deve usa-lo para o contexto das novas frases.

	Pontos importantes:
	* As novas frases em inglês devem ter sua tradução em português.
	* Limite a criação de até 3 novas frases, não ultrapasse esse número. Priorize palavras que se repetem no texto.

	Aqui está o texto para você extrair as palavras:
	${text}

	- A sua resposta deve seguir estritamente este formato de JSON válido:
			[
				{
					"en": "There was once a farmer and his wife.",
					"ptBR": "Existia/Havia/Tinha uma vez (era uma vez) um fazendeiro e sua esposa."
				},
				{
					...
				}
			]
`;
}

async function createFile(prompt, filename = '') {
	const jsonData = JSON.stringify(prompt, null, 2);
	const filePath = `${currentDir}/${filename}.json`;
	await writeFile(filePath, jsonData);
}

app.post('/generate-phrases', async (req, res) => {
	const { text } = req.body;

	const instruction = getInstruction(text);

	try {
		const completion = await openai.chat.completions.create({
			messages: [
				{ role: 'user', content: instruction }
			],
			model: 'gpt-3.5-turbo',
		});
	
		await createFile(completion.choices[0].message.content, 'prompt');
		await createFile(JSON.parse(completion.choices[0].message.content), 'phrases');
	
		return res.status(200).json({
			phrases: JSON.parse(completion.choices[0].message.content)
		});	
	} catch {
		return res.status(500).json({
			message: 'Internal Error',
			code: 'internal-error'
		});
	}
});

app.listen(3333, () => console.log(`Server running at http://localhost:${3333}`));
