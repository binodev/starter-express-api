const utils = require('../utils');
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
        name:'',
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
          
                  return h.response({ message: 'Texte combiné mis à jour avec succès',data: await chatbot.save(),documents:request.files});
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
            path: '/chatbots/{chatbotId}/chat',
            config: {
              auth: 'jwt',
              description: 'Chat with a specific chatbot',
              handler: async (request, h) => {
                try {
                  const { chatbotId } = request.params;
                  const { message } = request.body;
              
                  // Rechercher le chatbot à partir de l'ID
                  let ctrlChatbot= await zeRoute.chatbot
                  const chatbot = await ctrlChatbot.controller.service.Resource.findById(chatbotId);
                // Gestion de la connexion du client avec Socket.IO
                // Initialisation de Socket.IO
                const server = require('http').createServer();
                const io = socketIO(server);
                io.on('connection', (socket) => {
                  console.log('Nouvelle connexion :', socket.id);
        
                  // Gestion des messages de chat
                  socket.on('chat-message', async (data) => {
                    try {
                      // Appel à la fonction de traitement de chat pour obtenir une réponse
                      const reply = await handleChatRequest(data.message, chatbot);
        
                      // Envoyer la réponse du chatbot au client via Socket.IO
                      socket.emit('chat-reply', reply);
                    } catch (error) {
                      console.error(error);
                      socket.emit('chat-error', 'Une erreur s\'est produite lors du traitement de votre demande.');
                    }
                  });
                });
                    // Retourner une réponse vide, car la réponse du chatbot sera envoyée via Socket.IO
                  return '';
                } catch (error) {
                  console.error(error);
                  return { error: 'Erreur interne du serveur' };
                }
              },
              tags: ['api'],
            },
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


// Définition de la fonction de traitement de chat

// Configuration et initialisation de l'API OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
async function handleChatRequest(message, chatbot) {
  try {
      // Mettre à jour le message système avec le combinedText du chatbot
      const systemMessage = { role: 'system', content: chatbot.combinedText };

      // Construire l'historique des messages pour la demande d'achèvement du chat
      const messages = [
        systemMessage,
        ...chatbot.chatHistory,
        { role: 'user', content: message },
      ];
  
    // Appel à l'API OpenAI pour obtenir une réponse du chatbot
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: messages,
    });

    const assistantMessage = completion.data.choices[0].message;

    // Ajouter le message de l'assistant à l'historique des messages
    chatbot.chatHistory.push(assistantMessage);

    // Enregistrer les modifications dans la base de données (si nécessaire)


    // Retourner le message de l'assistant
    return assistantMessage;
  } catch (error) {
    console.error(error);
    return { role: 'assistant', content: 'Une erreur s\'est produite lors du traitement de votre demande.' };
  }
}
