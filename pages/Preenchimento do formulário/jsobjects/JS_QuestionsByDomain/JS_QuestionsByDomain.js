export default {
  // Collect answers for all questions, optionally filtered by dominio
  submitAnswersByDomain: (domain) => {
    const questions = Qry_getQuestions.data || [];

    // Filter questions by dominio if domain provided
    const filteredQuestions = domain 
      ? questions.filter(q => q.dominio === domain)
      : questions;

    return filteredQuestions.map((q, index) => {
      // Widget names are assumed to be swt_pergunta1, swt_pergunta2, etc.
      const switchName = `swt_pergunta${index + 1}`;
      const switchValue = this.getSwitchValue(switchName);

      return {
        id_resposta: Date.now().toString() + index,
        id_pergunta: q.id_pergunta,
        id_utilizador: appsmith.user.email, // replace when login available
        data_submissao: moment().format("YYYY-MM-DD"),
        resposta: switchValue ? "Yes" : "No",
        dominio: q.dominio
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
