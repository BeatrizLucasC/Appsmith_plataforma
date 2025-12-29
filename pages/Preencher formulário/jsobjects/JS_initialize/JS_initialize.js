export default {
  // Reactive properties to bind to widgets
  certSelected: [],
  spSelected: [],
  dimSelected: "",

  async initializePage() {
		//Login_user
		const autenticacao = {"username":"Beatriz Cardoso","nif":123456789,"email":"bcardoso@consulai.com"};
		await storeValue("autenticacao",autenticacao,true);
		
    // 1️⃣ Load saved filters
    await Qry_getFiltros.run();
    if (Qry_getFiltros.data?.length > 0) {
      const filtro = Qry_getFiltros.data[0];
      this.certSelected = filtro.certificacoes ? filtro.certificacoes.split(",") : [];
      this.spSelected = filtro.sistemas ? filtro.sistemas.split(",") : [];
      this.dimSelected = filtro.dimensao || "";
    }

    // 2️⃣ Load all questions
    await Qry_getQuestions.run();

    // 3️⃣ Load previous answers for all domains
    // Ambiental
    await Qry_getAnswersAmbiental.run();
    JS_regrasAmbiental.loadPreviousAnswers();

    // Económico
    await Qry_getAnswersEconomico.run();
    JS_regrasEconomico.loadPreviousAnswers();

    // Social
    await Qry_getAnswersSocial.run();
    JS_regrasSocial.loadPreviousAnswers();

    // 4️⃣ Compute visible questions for all domains
    const visAmbiental = JS_regrasAmbiental.getVisibleQuestions();
    const visEconomico = JS_regrasEconomico.getVisibleQuestions();
    const visSocial = JS_regrasSocial.getVisibleQuestions();

    console.log("Visible Ambiental questions on page load:", visAmbiental);
    console.log("Visible Económico questions on page load:", visEconomico);
    console.log("Visible Social questions on page load:", visSocial);
  }
};
