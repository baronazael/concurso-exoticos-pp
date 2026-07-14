// Depois de criar o projeto em https://console.firebase.google.com,
// va em Configuracoes do projeto > Seus apps > Web app > cole os valores abaixo.
const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "COLE_AQUI.firebaseapp.com",
  projectId: "COLE_AQUI",
  storageBucket: "COLE_AQUI.appspot.com",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
