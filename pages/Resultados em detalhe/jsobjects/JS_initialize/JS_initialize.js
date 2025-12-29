export default {
  async initializePage() {
		//Login_user
		const autenticacao = {"username":"bcardoso@consulai.com","nif":123456789,"email":"bcardoso@consulai.com"};
		await storeValue("autenticacao",autenticacao,true);
	}};