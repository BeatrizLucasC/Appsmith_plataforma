export default {
  _getContext() {
    const ano = Number(Tbl_resumo.selectedRow?.ano);
    const utilizador = Tbl_resumo.selectedRow?.email;

    return { ano, utilizador };
  },

  // Obter os ids das perguntas visíveis. Normaliza, remove nulos/duplicados e devolve JSON string.

  _getIdsJsonFromForm() {
    const data = Qry_respostasForm.data || [];
    const ids = data
      .map(r => r?.id_pergunta)
      .filter(id => id !== null && id !== undefined && String(id).trim() !== "");

    // Remover duplicados
    const uniqueIds = Array.from(new Set(ids));
    return JSON.stringify(uniqueIds);
  },

  //Atualiza os dados relevantes após validacao ou anulacao
  async _refreshAll() {
    try {
      // Pode rodar em paralelo
      await Promise.all([
        Qry_respostasForm.run(),
        Qry_dadosIniciais.run(),
				Qry_formsValidados.run(),
      ]);
    } catch (e) {
      // Não bloquear fluxo por falha de refresh, mas informar
      console.error("Falha ao refrescar dados:", e);
      showAlert("Alguns dados não foram atualizados. Tente atualizar novamente.", "warning");
    }
  },

  //Confirmar VALIDAÇÃO das respostas (marca como 'S' as últimas não validadas por pergunta).

  async confirmValidacao() {
    try {
      const { ano, utilizador } = this._getContext();

      const idsJson = this._getIdsJsonFromForm();

      await Qry_validacao.run({ ids_json: idsJson, ano, utilizador });

      closeModal('Modal_confirmacao');
      showAlert("Respostas validadas com sucesso.", "success");

      await this._refreshAll();
    } catch (e) {
      console.error("Erro em confirmValidacao:", e);
      showAlert("Falha ao validar respostas: " + (e?.message || e), "error");
    }
  },

  //Cancelar ação de validação (apenas feedback ao utilizador)

  cancelValidacao() {
    const ano = Tbl_resumo.selectedRow?.ano ?? "";
    const utilizador = Tbl_resumo.selectedRow?.email ?? "";
    showAlert(`Validação das respostas de ${ano} para ${utilizador} não foi executada.`, "info");
    closeModal('Modal_confirmacao');
  },

  //Confirmar ANULAÇÃO da validação (colcoar 'N' conforme a query).
 
  async confirmAnulacao() {
    try {
      const { ano, utilizador } = this._getContext();

      const idsJson = this._getIdsJsonFromForm();

      await Qry_validacaoAnular.run({ ids_json: idsJson, ano, utilizador });

      closeModal('Modal_confirmacaoAnulacao');
      showAlert("Anulação da validação das respostas de ${ano} para ${utilizador} foi executada com sucesso.", "success");

      await this._refreshAll();
    } catch (e) {
      console.error("Erro em confirmAnulacao:", e);
      showAlert("Falha ao anular validação: " + (e?.message || e), "error");
    }
  },

  //Cancelar ação de anulação de validação (apenas feedback ao utilizador).
  cancelAnulacao() {
    const ano = Tbl_resumo.selectedRow?.ano ?? "";
    const utilizador = Tbl_resumo.selectedRow?.email ?? "";
    showAlert(`Anulação da validação das respostas de ${ano} para ${utilizador} não foi executada.`, "info");
    closeModal('Modal_confirmacaoAnulacao');
  }
};
