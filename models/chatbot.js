const utils = require('../utils');
const fs = require('fs');
const natural = require('natural');
const axios = require('axios');
const pdfjs = require('pdfjs-dist');
const cheerio = require('cheerio');
const { Configuration, OpenAIApi } = require("openai");
const socketIO = require("socket.io");

module.exports = {
    type: 'resource',
    singular: 'chatbot',
    plural: 'chatbots',
    basePath: 'chatbot',
    model: {
      name: 'Chatbot',
      attributes: {
        admin: { ref: 'Admin' },
        name:{
          type: String,
          required: true,
          unique: true
        },
        prompt: {
            type: String,
          },
        urls:[ {
          type: String
        }],
          documents: [{
            type: String
          }],
          qnas: [{
            question: String,
            answer: String
          }],
          modelData: {
            type: Array
          },
          model: {
            type: String
          },
          combinedText: {
            type: String
          },
      }
    },
      references: 'admin'
  ,
    auth: {
      register: 'none'
    },

    api:{
      extraRoutes(zeRoute) {
        return [
          //Chatbot Training
          {
            file: true,
            method: 'PUT',
            path: ':resource/training',
            config: {
              auth: 'jwt',
              description: 'Chatbot Training',
              handler: async (request, h) => {
                try {
                  const resourceId = request.params.resource;
                  const resource = request.body.resource ? JSON.parse(request.body.resource) : {};
                  const deletedFiles = request.body.deletedFiles ? JSON.parse(request.body.deletedFiles) : [];
                  console.log(resource)
                  // Récupérer le chatbot à partir de l'ID
                  let ctrlChatbot = await zeRoute.chatbot;
                  const chatbot = await ctrlChatbot.controller.service.Resource.findById(resourceId);

                   // Supprimer les fichiers mentionnés dans le tableau "deletedFiles"
                  if (deletedFiles.length > 0) {
                    chatbot.documents = chatbot.documents.filter(document => {
                      return !deletedFiles.some(deletedFile => deletedFile.previewURL === document);
                    });
                  }

                    // Ajouter les nouveaux fichiers au tableau existant des documents
                  if (request.files) {
                    request.files.forEach(file => {
                      let location = file.transforms && file.transforms[0] ? file.transforms[0].location : file.location;
                      
                      if (file.fieldname === 'documents') {
                        if (!chatbot.documents) {
                          chatbot.documents = [];
                        }
                        chatbot.documents.push(location);
                      }
                    });
                  }
          
              // Copier les nouvelles valeurs des attributs, à l'exception du tableau "documents"
                Object.keys(resource).forEach((key) => {
                  if (key !== 'documents') {
                    chatbot[key] = resource[key];
                  }
                });
                  // Mettre à jour le texte combiné
                  chatbot.combinedText = await updateCombinedText(chatbot);
          
                  // Enregistrer les modifications dans la base de données
                  await chatbot.save();

                  /**   // Utilisez Natural pour diviser le texte en phrases
                  const tokenizer = new natural.SentenceTokenizer();
                  const sentences = tokenizer.tokenize(chatbot.combinedText);

                  // Créez un tableau pour stocker les paires prompt-complétion
                  const promptCompletionPairs = [];

                  // Parcourez les phrases pour générer les paires prompt-complétion
                  sentences.forEach((sentence) => {
                    // Définissez la phrase comme le prompt
                    const prompt = sentence.trim();

                    // Définissez une chaîne vide comme la complétion initiale
                    let completion = '';

                    // Ajoutez la paire prompt-complétion au tableau
                    promptCompletionPairs.push({ prompt, completion });
                  });

                  // Convertissez le tableau en une chaîne JSONL
                  const jsonlContent = promptCompletionPairs.map((pair) => JSON.stringify(pair)).join('\n');

                  // Écrivez la chaîne JSONL dans un fichier
                  fs.writeFileSync('output.jsonl', jsonlContent);
                 */   

                  return h.response({ message: 'Chatbot entraîné avec succès',data: await chatbot.save(),documents:request.files});
                } catch (error) {
                  console.error(error);
                  return h.response({ error: 'Erreur interne du serveur' }).code(500);
                }
              },
              tags: ['api']
            }
          },
          
         //Fonctionnalite de chatbot
          {
            method: 'POST',
            path: 'list/:name/:userId',
            config: {
              auth: false,
              description: 'Chat with a specific chatbot',
              handler: async (request, h) => {
                try {
                  const chatbotName = request.params.name;
                  const userId = request.params.userId;
                  const { message } = request.body;
              
                  // Rechercher le chatbot à partir de l'ID
                  let ctrlChatbot= await zeRoute.chatbot
                  const chatbot = await ctrlChatbot.controller.service.Resource.findOne({name:chatbotName});

                   let ctrlConversation = await zeRoute.conversation
                   const Conversation = await ctrlConversation.controller.service.Resource
                   let conversation = await ctrlConversation.controller.service.Resource.findOne({user:userId});
                   
                

                   if (!conversation) {
                    // Si la conversation n'existe pas, créer une nouvelle conversation
                    conversation = new Conversation({
                      user: userId,
                      history: [],
                    });
                  
                    await conversation.save();
                  }
        
                  
                // Configuration et initialisation de l'API OpenAI
                const configuration = new Configuration({
                  apiKey: process.env.OPENAI_API_KEY,
                });
                const openai = new OpenAIApi(configuration);

                 // Mettre à jour le message système avec le combinedText du chatbot
                  const systemMessage = { role: 'system', content: chatbot.combinedText };

                  // Construire l'historique des messages pour la demande d'achèvement du chat
                  const chatHistory = conversation.history.map(message => ({
                    role: message.role,
                    content: message.content,
                  }));

                  // Construire l'historique des messages pour la demande d'achèvement du chat
                  const messages = [
                    systemMessage,
                    ...chatHistory,
                    { role: 'user', content: message },
                  ];
           
                // Appel à l'API OpenAI pour obtenir une réponse du chatbot
                const completion = await openai.createChatCompletion({
                  model: "gpt-3.5-turbo",
                  temperature: 0.5,
                  messages: messages,
                  user:userId
                });
                        // Ajouter un nouveau message à la conversation
                        conversation.history.push({
                          role: 'user',
                          content: message,
                        });
        
                const assistantMessage = completion.data.choices[0].message;

                conversation.history.push(assistantMessage);
        
                // Enregistrer la conversation mise à jour
                await conversation.save();
                // Retourner le message de l'assistant
                return h.response({message: assistantMessage});
                } catch (error) {
                  console.error(error);
                  return { role: 'assistant', content: 'Une erreur s\'est produite lors du traitement de votre demande.' };
                }
              },
              tags: ['api'],
            },
          },
          //get a  user  chat history
          {
            method: 'GET',
            path: 'history/:userId',
            config: {
              auth: false,
              description: 'Get a user chat history',
              handler: async (request, h) => {
              const userId = request.params.userId;
              let ctrlConversation = await zeRoute.conversation
              const Conversation = await ctrlConversation.controller.service.Resource

              let conversation = await ctrlConversation.controller.service.Resource.findOne({user:userId});
              if (!conversation) {
                // Si la conversation n'existe pas, créer une nouvelle conversation
                conversation = new Conversation({
                  user: userId,
                  history: [],
                });
                await conversation.save();
              }
              return h.response(conversation.history.map(message => ({
                role: message.role,
                content: message.content,
              })));
              },
              tags: ['api'],
            }
          },
          //delete user history
          {
            method: 'DELETE',
            path: 'history/:userId',
            config: {
              auth: false,
              description: 'Delete a user chat history',
              handler: async (request, h) => {
                const userId = request.params.userId;
                let ctrlConversation = await zeRoute.conversation
                const Conversation = await ctrlConversation.controller.service.Resource
                let conversation = await ctrlConversation.controller.service.Resource.findOne({user:userId});
                if (conversation) {
                  conversation.history = [];
                  await conversation.save();
                }
                return h.response({ message: 'Chat history deleted' });
              },
              tags: ['api'],
            }
          }

        ]
      }
    }
  }

  async function updateCombinedText(chatbot) {
    let combinedText = chatbot.prompt || '';
  
    // Ajouter les URLs des sites au texte combiné
    for (const url of chatbot.urls) {
      const textFromUrl = await extractTextFromUrl(url);
      combinedText += ' ' + textFromUrl;
    }
  
    // Ajouter les documents au texte combiné
    for (const document of chatbot.documents) {
      const textFromDocument = await extractTextFromDocument(document);
      combinedText += ' ' + textFromDocument;
    }
  
    // Ajouter les paires de questions-réponses au texte combiné
    for (const qna of chatbot.qnas) {
      combinedText += ' ' + qna.question + ' ' + qna.answer;
    }
  
    return combinedText;
  }
// Fonction pour extraire le texte à partir d'une URL
async function extractTextFromUrl(url) {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);
  // Extraire le texte de la balise <body> ou d'autres éléments pertinents
  const text = $('body').text();
// Effectuer un post-traitement du texte extrait
const processedText = postProcessText(text);

return processedText;
}


// Fonction pour extraire le texte à partir d'un document
async function extractTextFromDocument(document) {
  try {
    const response = await axios.get(document, { responseType: 'arraybuffer' });
    const data = new Uint8Array(response.data);

    // Charger le document PDF
    const doc = await pdfjs.getDocument(data).promise;
    const numPages = doc.numPages;

    let text = '';

    // Parcourir chaque page du document
    for (let i = 1; i <= numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(item => item.str).join(' ');
      text += pageText;
    }

    // Effectuer un post-traitement du texte extrait
    const processedText = postProcessText(text);

    return processedText;
  } catch (error) {
    console.error('Erreur lors de l\'extraction du texte depuis le document :', error);
    return '';
  }
}
function postProcessText(text){
  return text.replace(/\n/g, '').replace(/\s+/g, ' ');
}

