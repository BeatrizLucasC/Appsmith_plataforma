export default {

  // Estado
  answers: {},

  // 1) Obter todas as perguntas do domínio "Ambiental"
  getQuestions() {
    const data = Qry_getQuestions.data || [];
    return data.filter(
      q => String(q.dominio || "").trim().toLowerCase() === "ambiental"
    );
  },

  // 2) Filtrar perguntas com base nos widgets (condicionalidades)
  filterQuestions() {
    const all = this.getQuestions();
    if (!all.length) return [];

    const selectedCert = Multiselect_Certificacao.selectedOptionValues || [];
    const selectedSP = Multiselect_SistemaProducao.selectedOptionValues || [];
    const selectedDE = Select_Dimensao.selectedOptionValue
      ? [Select_Dimensao.selectedOptionValue]
      : [];

    return all.filter(q => {
      // Bloqueio por certificação
      const hasCertN = selectedCert.some(col => q[col] === "N");
      if (hasCertN) return false;

      const hasSP = selectedSP.some(col => q[col] === "S");
      const hasDE = selectedDE.some(col => q[col] === "S");

      // Sem filtros → mostra tudo
      if (
        selectedCert.length === 0 &&
        selectedSP.length === 0 &&
        selectedDE.length === 0
      ) {
        return true;
      }

      // OU entre sistema e dimensão
      return hasSP || hasDE;
    });
  },

  // 2.1) Todas as perguntas filtradas (sem condicionalidades de resposta)
  getAllFilteredQuestions() {
    return this.filterQuestions();
  },

  // 3) Ordenação por condicionalidade com base nas respostas dadas
  getVisibleQuestions() {
    const all = this.filterQuestions();
    const answers = this.answers || {};
    if (!all.length) return [];

    const byId = Object.fromEntries(all.map(q => [String(q.id_pergunta), q]));

    const visible = [];
    const visited = new Set();
    let currentIndex = 0;

    while (currentIndex < all.length) {
      const current = all[currentIndex];
      const id = String(current.id_pergunta);

      // Proteção contra loops
      if (visited.has(id)) break;
      visited.add(id);

      visible.push(current);

      const ans = answers[id];
      let nextId = null;

      if (ans === "Sim" && current.condicao_sim) nextId = current.condicao_sim;
      else if (ans === "Não" && current.condicao_nao) nextId = current.condicao_nao;
      else if (ans === "NA" && current.condicao_na) nextId = current.condicao_na;

      const nextIndex =
        nextId && byId[nextId]
          ? all.findIndex(q => String(q.id_pergunta) === String(nextId))
          : -1;

      if (nextIndex >= 0 && nextIndex !== currentIndex) {
        currentIndex = nextIndex;
      } else {
        currentIndex++;
      }
    }

    return visible;
  },

  // 4) Label da pergunta (sem traços antes/depois do título)
  questionLabel: row => row ? `${row.id_pergunta || ""} ${row.pergunta || ""}` : "",

  // 5) Opções do Radio
  radioOptions(row) {
    const options = [
      { label: "Sim", value: "Sim" },
      { label: "Não", value: "Não" }
    ];
    if (row.na === "S") {
      options.unshift({ label: "NA", value: "NA" });
    }
    return options;
  },

  // 6) Valor selecionado no Radio
  selectedValue(row) {
    return this.answers?.[row.id_pergunta] || "";
  },

  // 7) Handler de mudança de seleção
  onSelectionChange(row, selectedValue) {
    if (!row) return;
    this.answers = {
      ...this.answers,
      [String(row.id_pergunta)]: selectedValue
    };
  },

  // 8) Preparar respostas para guardar (todas as visíveis)
  prepareAnswers() {
    const all = this.getVisibleQuestions();
    const userEmail = appsmith.user.email || "unknown_user";
    const year = new Date().getFullYear();
    const answers = this.answers || {};
    const dominio = "ambiental";

    return all.map(q => ({
      id_resposta: `${userEmail}_${year}_${q.id_pergunta}`,
      id_pergunta: q.id_pergunta,
      id_utilizador: userEmail,
      resposta: answers[q.id_pergunta]
        ? String(answers[q.id_pergunta]).trim()
        : null,
      ano: year,
      dominio
    }));
  },

  // 9) Construir VALUES para o INSERT (inclui validacao='N' para novas linhas)
  buildValues() {
    const prepared = this.prepareAnswers();
    if (!prepared.length) {
      // "dummy" para evitar VALUES vazio
      return "('none','none','none',NULL,NOW(),0,'ambiental','N')";
    }

    return prepared
      .map(ans => {
        const safeVal =
          ans.resposta === null
            ? "NULL"
            : `'${String(ans.resposta).replace(/'/g, "''")}'`;
        return `(
          '${ans.id_resposta}',
          '${ans.id_pergunta}',
          '${ans.id_utilizador}',
          ${safeVal},
          NOW(),
          ${ans.ano},
          '${ans.dominio}',
          'N'
        )`;
      })
      .join(", ");
  },

  // 10) Validação: todas as visíveis respondidas
  isReadyToSubmit() {
    const visibleQuestions = this.getVisibleQuestions();
    return visibleQuestions.every(q =>
      ["Sim", "Não", "NA"].includes(this.answers?.[q.id_pergunta])
    );
  },

  // 11) Submissão
  async onSubmit() {
    if (!this.isReadyToSubmit()) {
      showAlert(
        "É necessário responder a todas as perguntas para submeter.",
        "warning"
      );
      return;
    }

    await Qry_checkExistingAmbiental.run();
    const hasExisting =
      Array.isArray(Qry_checkExistingAmbiental.data) &&
      Qry_checkExistingAmbiental.data.length > 0;

    if (hasExisting) {
      showModal("Modal_ConfirmAmbiental");
    } else {
      await Qry_saveAnswersAmbiental.run();
      showAlert(
        "Respostas do domínio ambiental submetidas com sucesso!",
        "success"
      );
    }
  },

  // 12) Confirmar substituição
  async confirmReplace() {
    await Qry_saveAnswersAmbiental.run();
    closeModal("Modal_ConfirmAmbiental");
    showAlert("Respostas substituídas com sucesso!", "success");
  },

  // 13) Cancelar substituição
  cancelReplace() {
    closeModal("Modal_ConfirmAmbiental");
    showAlert("Substituição cancelada.", "info");
  },

  // 14) Carregar respostas anteriores
  loadPreviousAnswers() {
    const data = Qry_getAnswersAmbiental.data || [];
    const mapped = {};

    data.forEach(row => {
      if (row.id_pergunta && row.resposta != null) {
        mapped[String(row.id_pergunta)] = String(row.resposta).trim();
      }
    });

    this.answers = mapped;
  },

  // 15) Aplicar filtros e carregar respostas anteriores
  async aplicarFiltrosECarregarRespostas() {
    const perguntas = this.getAllFilteredQuestions();
    if (perguntas.length > 0) {
      await Qry_getAnswersAmbiental.run();
      this.loadPreviousAnswers();
    }
  }
};