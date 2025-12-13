export default {
  // Armazena respostas do utilizador
  answers: {},

  // 1️⃣ Obter todas as perguntas do domínio "Ambiental"
  getQuestions() {
    const data = Qry_getQuestions.data || [];
    return data.filter(
      q => String(q.dominio || "").trim().toLowerCase() === "ambiental"
    );
  },

  // 2️⃣ Filtrar perguntas com base nos widgets
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

  // 2.1️⃣ Todas as perguntas filtradas (sem condicionalidades)
  getAllFilteredQuestions() {
    return this.filterQuestions();
  },

  // 3️⃣ Perguntas visíveis com condicionalidades (versão segura)
  getVisibleQuestions() {
    const all = this.filterQuestions();
    const answers = this.answers || {};
    if (!all.length) return [];

    const byId = Object.fromEntries(
      all.map(q => [String(q.id_pergunta), q])
    );

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
          ? all.findIndex(
              q => String(q.id_pergunta) === String(nextId)
            )
          : -1;

      if (nextIndex >= 0 && nextIndex !== currentIndex) {
        currentIndex = nextIndex;
      } else {
        currentIndex++;
      }
    }

    return visible;
  },

  // 4️⃣ Label da pergunta & icone informacao adicional
  questionLabel: row => row ? `${row.id_pergunta || ""} — ${row.pergunta || ""}` : "",
	
  // 5️⃣ Opções do RadioGroup
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

  // 6️⃣ Valor selecionado
  selectedValue(row) {
    return this.answers?.[row.id_pergunta] || "";
  },

  // 7️⃣ Atualizar resposta
  onSelectionChange(row, selectedValue) {
    if (!row) return;
    this.answers = {
      ...this.answers,
      [String(row.id_pergunta)]: selectedValue
    };
  },

  // 8️⃣ Preparar respostas para guardar
  prepareAnswers() {
    const all = this.getVisibleQuestions();
    const userEmail = appsmith.user.email || "unknown_user";
    const year = new Date().getFullYear();
    const answers = this.answers || {};
    const dominio = "ambiental"; // ✅ CORRIGIDO

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

  // 9️⃣ Construir valores SQL
  buildValues() {
    const prepared = this.prepareAnswers();
    if (!prepared.length) {
      return "('none','none','none',NULL,NOW(),0,'ambiental')";
    }

    return prepared
      .map(ans => {
        const safeVal =
          ans.resposta === null
            ? "NULL"
            : `'${ans.resposta.replace(/'/g, "''")}'`;
        return `(
          '${ans.id_resposta}',
          '${ans.id_pergunta}',
          '${ans.id_utilizador}',
          ${safeVal},
          NOW(),
          ${ans.ano},
          '${ans.dominio}'
        )`;
      })
      .join(", ");
  },

  // 🔟 Verificar se todas as perguntas visíveis foram respondidas
  isReadyToSubmit() {
    const visibleQuestions = this.getVisibleQuestions();
    return visibleQuestions.every(q =>
      ["Sim", "Não", "NA"].includes(this.answers?.[q.id_pergunta])
    );
  },

  // 1️⃣1️⃣ Submeter respostas
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

  // 1️⃣2️⃣ Confirmar substituição
  async confirmReplace() {
    await Qry_saveAnswersAmbiental.run();
    closeModal("Modal_ConfirmAmbiental");
    showAlert("Respostas substituídas com sucesso!", "success");
  },

  // 1️⃣3️⃣ Cancelar substituição
  cancelReplace() {
    closeModal("Modal_ConfirmAmbiental");
    showAlert("Substituição cancelada.", "info");
  },

  // 1️⃣4️⃣ Carregar respostas anteriores
  loadPreviousAnswers() {
    const data = Qry_getAnswersAmbiental.data || [];
    const mapped = {};

    data.forEach(row => {
      if (row.id_pergunta && row.resposta) {
        mapped[String(row.id_pergunta)] = row.resposta;
      }
    });

    this.answers = mapped;
  },

  // 1️⃣5️⃣ Aplicar filtros e carregar respostas anteriores
  async aplicarFiltrosECarregarRespostas() {
    const perguntas = this.getAllFilteredQuestions();
    if (perguntas.length > 0) {
      await Qry_getAnswersAmbiental.run();
      this.loadPreviousAnswers();
    }
  }
};