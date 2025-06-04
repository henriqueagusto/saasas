// Configuração do Firebase
const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    projectId: "SEU_PROJETO_ID"
};

// Inicialização
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Elementos do DOM
const registerForm = document.getElementById('registerForm');
const submitButton = registerForm.querySelector('button');
const buttonText = submitButton.querySelector('.button-text');
const buttonLoader = submitButton.querySelector('.button-loader');

// Evento de Cadastro
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Mostra loader
    buttonText.classList.add('hidden');
    buttonLoader.classList.remove('hidden');
    
    const email = registerForm.email.value;
    const password = registerForm.password.value;
    const name = registerForm.name.value;

    try {
        // Cria usuário
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Atualiza nome do usuário
        await userCredential.user.updateProfile({
            displayName: name
        });
        
        // Redireciona após 1s
        setTimeout(() => {
            window.location.href = '../dashboard.html';
        }, 1000);
        
    } catch (error) {
        // Tratamento de erros
        let errorMessage;
        switch(error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Este e-mail já está cadastrado.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'E-mail inválido.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Senha muito fraca (mínimo 6 caracteres).';
                break;
            default:
                errorMessage = 'Erro desconhecido. Tente novamente.';
        }
        
        alert(errorMessage);
    } finally {
        // Esconde loader
        buttonText.classList.remove('hidden');
        buttonLoader.classList.add('hidden');
    }
});