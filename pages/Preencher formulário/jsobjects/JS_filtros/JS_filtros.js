export default {
  // 0️⃣ Estado interno (não persistente)
  filtrosGuardados: false,

  // Helpers para SQL-safe
  _sqlSafe(str) {
    if (str == null || str === "") return "NULL";
    return `'${String(str).replace(/'/g, "''")}'`;
  },
  _sqlSafeJoin(arr) {
    const s = Array.isArray(arr) ? arr.join(",") : "";
    return this._sqlSafe(s);
  },

  // Helpers de validação
  _hasSelectedDimensao() {
    return !!Select_Dimensao?.selectedOptionValue;
  },
  _hasSelectedSistemas() {
    return Array.isArray(Multiselect_SistemaProducao?.selectedOptionValues)
      && Multiselect_SistemaProducao.selectedOptionValues.length > 0;
  },
  _hasSelectedMaoDeObra() {
    return Array.isArray(Multiselect_MaoDeObra?.selectedOptionValues)
      && Multiselect_MaoDeObra.selectedOptionValues.length > 0;
  },
  _hasAllBinarySelects() {
    const list = [
      Select_OP?.selectedOptionValue,
      Select_ProxResidencias?.selectedOptionValue,
      Select_Fitofarmaceuticos?.selectedOptionValue,
      Select_AguasResiduais?.selectedOptionValue,
      Select_ConsumoEnergetico?.selectedOptionValue,
    ];
    // Todos têm de estar preenchidos
    return list.every(v => !!v);
  },

  // 1️⃣ Construir valores SQL para guardar filtros
  buildValoresFiltros() {
    const nif = appsmith.store.autenticacao?.nif || "unknown_user";
    const ano = new Date().getFullYear();
    const utilizador_ano = `${nif}_${ano}`;

    const certificacoes = Multiselect_Certificacao?.selectedOptionValues || [];
    const sistemas       = Multiselect_SistemaProducao?.selectedOptionValues || [];
    const dimensao       = Select_Dimensao?.selectedOptionValue || "";
    const maoDeObra      = Multiselect_MaoDeObra?.selectedOptionValues || [];
    const opSel          = Select_OP?.selectedOptionValue || "";
    const proxSel        = Select_ProxResidencias?.selectedOptionValue || "";
    const fitoSel        = Select_Fitofarmaceuticos?.selectedOptionValue || "";
    const aguasSel       = Select_AguasResiduais?.selectedOptionValue || "";
    const energiaSel     = Select_ConsumoEnergetico?.selectedOptionValue || "";

    // SQL-safe
    const utilizadorAnoSQL = this._sqlSafe(utilizador_ano);
    const nifSQL           = this._sqlSafe(nif);
    const certSQL          = this._sqlSafeJoin(certificacoes); // opcional
    const sistSQL          = this._sqlSafeJoin(sistemas);
    const dimSQL           = this._sqlSafe(dimensao);
    const maoSQL           = this._sqlSafeJoin(maoDeObra);
    const opSQL            = this._sqlSafe(opSel);
    const proxSQL          = this._sqlSafe(proxSel);
    const fitoSQL          = this._sqlSafe(fitoSel);
    const aguasSQL         = this._sqlSafe(aguasSel);
    const energiaSQL       = this._sqlSafe(energiaSel);

    // Garante que a tua query INSERT usa esta ordem de colunas
    // (utilizador_ano, nif, ano, certificacoes, sistemas, dimensao, mao_de_obra,
    //  op, prox_residencias, fitofarmaceuticos, aguas_residuais, consumo_energetico, criado_em)
    return `(
      ${utilizadorAnoSQL},
      ${nifSQL},
      ${ano},
      ${certSQL},
      ${sistSQL},
      ${dimSQL},
			NOW(),
      ${maoSQL},
      ${opSQL},
      ${proxSQL},
      ${fitoSQL},
      ${aguasSQL},
      ${energiaSQL}
    )`;
  },

  // 2️⃣ Iniciar processo de guardar (verificar existência)
  async saveFilterSelections() {
    // Validação estrita ANTES de qualquer operação
    if (!this.filtrosPreenchidos()) {
      this._alertMissingFilters();
      return;
    }

    const nif = appsmith.store.autenticacao?.nif || "unknown_user";
    const ano = new Date().getFullYear();
    const utilizador_ano = `${nif}_${ano}`;

    await Qry_checkExistingFiltros.run({ utilizador_ano });
    const hasExisting = (Qry_checkExistingFiltros?.data || []).length > 0;

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
    // Validação estrita ANTES de confirmar
    if (!this.filtrosPreenchidos()) {
      this._alertMissingFilters();
      return;
    }

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

  // 6️⃣ Verificar se os filtros estão preenchidos (versão estrita)
  // Certificações opcionais; todos os outros são obrigatórios.
  filtrosPreenchidos() {
    return (
      this._hasSelectedDimensao() &&
      this._hasSelectedSistemas() &&
      this._hasSelectedMaoDeObra() &&
      this._hasAllBinarySelects()
    );
  },

  // 6.1. Aviso para quando faltam filtros
  _alertMissingFilters() {
    const missing = [];

    if (!this._hasSelectedDimensao())    missing.push("Dimensão");
    if (!this._hasSelectedSistemas())    missing.push("Sistema de Produção");
    if (!this._hasSelectedMaoDeObra())   missing.push("Mão de Obra");
    if (!this._hasAllBinarySelects()) {
      missing.push("Selects binários (OP, Proximidade Residências, Fitofarmacêuticos, Águas Residuais, Consumo Energético)");
    }

    const msg = `Para continuar, preencha: ${missing.join(" • ")}.`;
    showAlert(msg, "warning");
  },

  // 7️⃣ Verificar se as abas devem estar visíveis
  abasVisiveis() {
    return this.filtrosPreenchidos() || this.filtrosGuardados === true;
  },

  // 8️⃣ Guardar filtros e ativar visibilidade das abas
  async guardarFiltrosEAtivarAbas() {
    await this.saveFilterSelections();
    if (this.filtrosPreenchidos()) {
      this.filtrosGuardados = true;
    }
  },
};

