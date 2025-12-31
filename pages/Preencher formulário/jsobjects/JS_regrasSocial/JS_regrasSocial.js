export default {
  // Estado
  answers: {},

  // 1) Obter todas as perguntas do domínio "Social"
  getQuestions() {
    const data = Qry_getQuestions.data || [];
    return data.filter(
      q => String(q.dominio || "").trim().toLowerCase() === "social"
    );
  },

	// 2) Filtrar perguntas com base nos widgets (condicionalidades)
	filterQuestions() {
		const all = this.getQuestions();
		if (!all.length) return [];

		// Helpers para ler "S"/"N" com segurança
		const norm = (v) => String(v ?? "").trim().toUpperCase();
		const isS = (row, col) => norm(row?.[col]) === "S";
		const isN = (row, col) => norm(row?.[col]) === "N";

		// Widgets (seleções dos filtros)
		const selectedCert = Multiselect_Certificacao?.selectedOptionValues || [];

		const selectedSP   = Multiselect_SistemaProducao?.selectedOptionValues || [];
		const selectedDE   = Select_Dimensao?.selectedOptionValue
			? [Select_Dimensao.selectedOptionValue]
			: [];
		const selectedMO   = Multiselect_MaoDeObra?.selectedOptionValues || [];

		const opSel        = Select_OP?.selectedOptionValue;               // "op_sim" | "op_nao"
		const proxSel      = Select_ProxResidencias?.selectedOptionValue;  // "prox_residencias_sim" | "prox_residencias_nao"
		const fitoSel      = Select_Fitofarmaceuticos?.selectedOptionValue;// "fitofarmaceuticos_sim" | "fitofarmaceuticos_nao"
		const aguasSel     = Select_AguasResiduais?.selectedOptionValue;   // "aguas_residuais_sim" | "aguas_residuais_nao"
		const energiaSel   = Select_ConsumoEnergetico?.selectedOptionValue;// "consumo_energetico_sim" | "consumo_energetico_nao"

		const selectedBinaryCols = [opSel, proxSel, fitoSel, aguasSel, energiaSel].filter(Boolean);

		// ❗ "Outros filtros" são obrigatórios: todos os grupos têm de ter pelo menos uma seleção
		const allOtherGroupsSelected =
			selectedSP.length > 0 &&
			selectedDE.length > 0 &&
			selectedMO.length > 0 &&
			selectedBinaryCols.length > 0;

		if (!allOtherGroupsSelected) return [];

		return all.filter(q => {
			// --- Certificações ---
			const hasCertN = selectedCert.some(col => isN(q, col));
			if (hasCertN) return false;

			// Regra permissiva: sem certificações selecionadas é OK; se houver, não pode ter "N"
			const certOK = selectedCert.length === 0 ? true : !hasCertN;

			// --- Outros filtros ---
			// SP (multiselect): pelo menos UMA seleção tem de ser "S"
			const spOK  = selectedSP.some(col => isS(q, col));

			// Dimensão (single select): tem de ser "S"
			const deOK  = selectedDE.every(col => isS(q, col));

			// Mão de Obra (multiselect): pelo menos UMA seleção tem de ser "S"
			const moOK  = selectedMO.some(col => isS(q, col));

			// Binários: cada selecionado tem de ser "S"
			const binOK = selectedBinaryCols.every(col => isS(q, col));

			const otherOK = spOK && deOK && moOK && binOK;

			// Decisão final segundo a tabela desejada
			return certOK && otherOK;
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

	// 8) Preparar respostas para guardar
	// Inclui todas as perguntas filtradas pelos filtros dos dados iniciais
	// Força NULL nas que não estão visíveis pela lógica condicional.
	prepareAnswers() {
		const allFiltered = this.getAllFilteredQuestions(); // antes: getVisibleQuestions()
		const visible = this.getVisibleQuestions();         // caminho condicional atual
		const userId = appsmith.store.autenticacao?.nif || "unknown_user";
		const year = new Date().getFullYear();
		const answers = this.answers || {};
		const dominio = "social";

		// Conjunto de IDs visíveis (para decisão de NULL)
		const visibleIds = new Set(visible.map(q => String(q.id_pergunta)));

		return allFiltered.map(q => {
			const idPerg = String(q.id_pergunta);
			const currentAns = answers[idPerg];

			// Regra:
			// - Se a pergunta está visível -> guarda a resposta
			// - Se a pergunta está oculta pela lógica condicional -> força resposta = NULL
			const respostaFinal = visibleIds.has(idPerg)
				? (currentAns ? String(currentAns).trim() : null)
				: null;

			return {
				id_resposta: `${userId}_${year}_${idPerg}`,
				id_pergunta: idPerg,
				id_utilizador: userId,
				resposta: respostaFinal,
				ano: year,
				dominio
			};
		});
	},

  // 9) Construir VALUES para o INSERT (inclui validacao='N' para novas linhas)
  buildValues() {
    const prepared = this.prepareAnswers();
    if (!prepared.length) {
      // "dummy" para evitar VALUES vazio
      return "('none','none','none',NULL,NOW(),0,'social','N')";
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

    await Qry_checkExistingSocial.run();
    const hasExisting =
      Array.isArray(Qry_checkExistingSocial.data) &&
      Qry_checkExistingSocial.data.length > 0;

    if (hasExisting) {
      showModal("Modal_ConfirmSocial");
    } else {
      await Qry_saveAnswersSocial.run();
      showAlert(
        "Respostas do domínio social submetidas com sucesso!",
        "success"
      );
    }
  },

  // 12) Confirmar substituição
  async confirmReplace() {
    await Qry_saveAnswersSocial.run();
    closeModal("Modal_ConfirmSocial");
    showAlert("Respostas substituídas com sucesso!", "success");
  },

  // 13) Cancelar substituição
  cancelReplace() {
    closeModal("Modal_ConfirmSocial");
    showAlert("Substituição cancelada.", "info");
  },

  // 14) Carregar respostas anteriores
  loadPreviousAnswers() {
    const data = Qry_getAnswersSocial.data || [];
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
      await Qry_getAnswersSocial.run();
      this.loadPreviousAnswers();
    }
  }
};

