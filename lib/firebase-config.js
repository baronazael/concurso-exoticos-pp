// Depois de criar o projeto em https://console.firebase.google.com,
// va em Configuracoes do projeto > Seus apps > Web app > cole os valores abaixo.
const firebaseConfig = {
  apiKey: "AIzaSyAWCx8GJ5LXoKdY-3ZGF_KB5MoOjqopd3s",
  authDomain: "concurso-exoticos-pp.firebaseapp.com",
  projectId: "concurso-exoticos-pp",
  storageBucket: "concurso-exoticos-pp.firebasestorage.app",
  messagingSenderId: "486501491425",
  appId: "1:486501491425:web:1d6881a7bd6e0372764da0",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
