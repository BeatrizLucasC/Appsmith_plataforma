export default {
  certSelected: [],
  spSelected: [],
  dimSelected: "",
  
  async initializePage() {
    // 1️⃣ Load saved filters
    await Qry_getFiltros.run();
    if (Qry_getFiltros.data?.length > 0) {
      const filtro = Qry_getFiltros.data[0];
      this.certSelected = filtro.certificacoes ? filtro.certificacoes.split(",") : [];
      this.spSelected = filtro.sistemas ? filtro.sistemas.split(",") : [];
      this.dimSelected = filtro.dimensao || "";
    }

    // 2️⃣ Load questions
    await Qry_getQuestions.run();

    // 3️⃣ Load previous answers
    await Qry_getAnswersAmbiental.run();
    JS_regrasAmbiental.loadPreviousAnswers();

    // 4️⃣ Compute visible questions
    const visibleQuestions = JS_regrasAmbiental.getVisibleQuestions();
    console.log("Visible questions on page load:", visibleQuestions);
  }
};
