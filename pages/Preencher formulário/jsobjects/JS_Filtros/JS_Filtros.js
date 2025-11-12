export default {
  // 1️⃣ Build SQL values for saving filters
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

  // 2️⃣ Start save process (check existing)
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
      showAlert("Preferências guardadas com sucesso!", "success");
    }
  },

  // 3️⃣ Confirm replacement of existing filters
  async confirmReplaceFilterSelections() {
    await this.replaceFilterSelections();
    closeModal("Modal_ConfirmReplaceFilters");
    showAlert("Filtros anteriores substituídos com sucesso!", "success");
  },

  // 4️⃣ Cancel replacement
  cancelFilterSelections() {
    closeModal("Modal_ConfirmReplaceFilters");
    showAlert("Substituição cancelada. As preferências anteriores foram mantidas.", "info");
  },

  // 5️⃣ Execute save query
  async replaceFilterSelections() {
    await Qry_saveFiltros.run();
  },
};
