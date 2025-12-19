export default {
  async confirmValidacao() {
    try {
      // Cria JSON dos id_pergunta visíveis na tabela de respostas
      const idsJson = JSON.stringify((Qry_respostasForm.data || []).map(r => r.id_pergunta));

      // Passa o parâmetro para a query (fica disponível em this.params.ids_json)
      await Qry_validacao.run({ ids_json: idsJson });

      closeModal('Modal_confirmacao');
      showAlert("Respostas validadas com sucesso.", "success");

      // Refrescar dados
      await Qry_respostasForm.run();
      await Qry_filtrosForm.run();
      await Qry_utilizador.run();
    } catch (e) {
      showAlert("Falha ao validar respostas: " + (e?.message || e), "error");
    }
  },

  cancelValidacao() {
    const ano = Select_year.selectedOptionValue || "";
    const utilizador = Select_utilizador.selectedOptionValue || "";
    showAlert(`Validação das respostas de ${ano} para ${utilizador} não foi executada.`, "info");
    closeModal('Modal_confirmacao');
  }
};
