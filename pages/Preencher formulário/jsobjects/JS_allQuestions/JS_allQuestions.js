export default {
  // Optional helper: get current question
  getCurrentQuestion: () => {
    const currentIndex = appsmith.store.currentIndex || 0;
    const questions = Qry_getQuestions.data || [];
    return questions[currentIndex] || null;
  },

  // Prepare all answers for submission
  submitAllAnswers: () => {
    const questions = Qry_getQuestions.data || [];

    return questions.map((q, index) => {
      const switchName = `swt_pergunta${index + 1}`;
      const switchWidget = this.getSwitchValue(switchName);

      return {
        id_resposta: Date.now().toString() + index,
        id_pergunta: q.id_pergunta,
        id_utilizador: "anonymous",
        data_submissao: moment().format("YYYY-MM-DD"),
        resposta: switchWidget ? "Yes" : "No"
      };
    });
  },

  getSwitchValue: (name) => {
    try {
      return eval(name).value;
    } catch (e) {
      return false;
    }
  }
}

