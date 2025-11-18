export default {
  // 0️⃣ Estado interno (não persistente)
  filtrosGuardados: false,

  // 1️⃣ Construir valores SQL para guardar filtros
  buildValoresFiltros() {
    const email = appsmith.user.email || "unknown_user";
    const ano = new Date().getFullYear();
    const utilizador_ano = `${email}_${ano}`;
    const certificacoes = (Multiselect_Certificacao.selectedOptionValues || []).join(",");
    const sistemas = (Multiselect_SistemaProducao.selectedOptionValues || []).join(",");
    const dimensao = Select_Dimensao.selectedOptionValue || "";

    const cert = certificacoes ? `'${certificacoes.replace(/'/g, "''")}'` : "NULL";
    const sist = sistemas ? `'${sistemas.replace(/'/g, "''")}'` : "NULL";
    const dim = dimensao ? `'${dimensao.replace(/'/g, "''")}'` : "NULL";

    return `('${utilizador_ano}', '${email}', ${ano}, ${cert}, ${sist}, ${dim}, NOW())`;
  },

  // 2️⃣ Iniciar processo de guardar (verificar existência)
  async saveFilterSelections() {
    const email = appsmith.user.email || "unknown_user";
    const ano = new Date().getFullYear();
    const utilizador_ano = `${email}_${ano}`;

    await Qry_checkExistingFiltros.run({ utilizador_ano });
    const hasExisting = (Qry_checkExistingFiltros.data || []).length > 0;

    if (hasExisting) {
      showModal("Modal_ConfirmReplaceFilters");
    } else {
      await this.replaceFilterSelections();
      this.filtrosGuardados = true;
      showAlert("Preferências guardadas com sucesso!", "success");
    }
  },

  // 3️⃣ Confirmar substituição de filtros existentes
  async confirmReplaceFilterSelections() {
    await this.replaceFilterSelections();
    this.filtrosGuardados = true;
    closeModal("Modal_ConfirmReplaceFilters");
    showAlert("Filtros anteriores substituídos com sucesso!", "success");
  },

  // 4️⃣ Cancelar substituição
  cancelFilterSelections() {
    closeModal("Modal_ConfirmReplaceFilters");
    showAlert("Substituição cancelada. As seleções anteriores foram mantidas.", "info");
  },

  // 5️⃣ Executar query de substituição
  async replaceFilterSelections() {
    await Qry_saveFiltros.run();
  },

  // 6️⃣ Verificar se os filtros estão preenchidos
  filtrosPreenchidos() {
    return (
      Select_Dimensao.selectedOptionValue &&
      Multiselect_Certificacao.selectedOptionValues.length > 0 &&
      Multiselect_SistemaProducao.selectedOptionValues.length > 0
    );
  },

  // 7️⃣ Verificar se as abas devem estar visíveis
  abasVisiveis() {
    return this.filtrosPreenchidos() && this.filtrosGuardados === true;
  },

  // 8️⃣ Guardar filtros e ativar visibilidade das abas
  async guardarFiltrosEAtivarAbas() {
    await this.saveFilterSelections();
    if (this.filtrosPreenchidos()) {
      this.filtrosGuardados = true;
    }
  },
};
