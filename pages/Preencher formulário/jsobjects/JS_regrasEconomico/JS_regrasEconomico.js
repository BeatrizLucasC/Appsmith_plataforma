export default {
  // Estado
  answers: {},

  // Normalização de strings (remove acentos, lower-case)
  normalize(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  },

  // 1) Obter todas as perguntas do domínio "Económico"
  getQuestions() {
    const data = Qry_getQuestions.data || [];
    return data.filter(
      q => this.normalize(q.dominio) === "economico"
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
  // Parâmetro onlyVisible: true => apenas perguntas visíveis; false => todas as filtradas
  prepareAnswers({ onlyVisible = true } = {}) {
    const questions = onlyVisible ? this.getVisibleQuestions() : this.getAllFilteredQuestions();
    const userId = appsmith.store.autenticacao?.nif || "unknown_user";
    const year = new Date().getFullYear();
    const answers = this.answers || {};
    const dominio = "economico"; // guardado sem acento, comparações via normalize()

    return questions.map(q => {
      const idPerg = String(q.id_pergunta);
      const currentAns = answers[idPerg]; // "Sim" | "Não" | "NA" | undefined

      // Se visível mas ainda sem resposta -> guarda NULL (para manter id na última utilização)
      const respostaFinal = currentAns ? String(currentAns).trim() : null;

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
  // Por defeito, envia só visíveis (onlyVisible = true)
  buildValues({ onlyVisible = true } = {}) {
    const prepared = this.prepareAnswers({ onlyVisible });
    if (!prepared.length) {
      // Evita executar o SQL quando não há perguntas visíveis
      // Sugestão: no botão "Guardar", usa isReadyToSubmit() para bloquear o submit
      return "";
    }

    return prepared
      .map(ans => {
        const safeVal = ans.resposta === null ? "NULL" : `'${String(ans.resposta).replace(/'/g, "''")}'`;
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

  // 11) Submissão
  async onSubmit() {
    try {
      await Qry_checkExistingEconomico.run();
      const hasExisting =
        Array.isArray(Qry_checkExistingEconomico.data) &&
        Qry_checkExistingEconomico.data.length > 0;

      if (hasExisting) {
        showModal("Modal_ConfirmEconomico");
        return;
      }

      // Grava
      await Qry_saveAnswersEconomico.run();

      // Refresh do query de leitura para refletir a BD
      if (typeof Qry_getAnswersEconomico?.run === "function") {
        await Qry_getAnswersEconomico.run();
      }

      showAlert("Respostas do domínio económico submetidas com sucesso!", "success");
    } catch (e) {
      console.error("Erro em onSubmit:", e);
      showAlert("Ocorreu um erro ao submeter. Tenta novamente.", "error");
    }
  },

  // 12) Confirmar substituição
  async confirmReplace() {
    try {
      await Qry_saveAnswersEconomico.run();

      // Refresh do query de leitura
      if (typeof Qry_getAnswersEconomico?.run === "function") {
        await Qry_getAnswersEconomico.run();
      }

      closeModal("Modal_ConfirmEconomico");

      if (this.isFormPersistedCompletely()) {
        showAlert("Formulário completo. Respostas substituídas com sucesso!", "success");
      } else {
        showAlert("Respostas substituídas. Existem ainda perguntas visíveis sem resposta na BD.", "info");
      }
    } catch (e) {
      console.error("Erro em confirmReplace:", e);
      showAlert("Ocorreu um erro ao substituir. Tenta novamente.", "error");
    }
  },

  // 13) Cancelar substituição
  cancelReplace() {
    closeModal("Modal_ConfirmEconomico");
    showAlert("Substituição cancelada.", "info");
  },

  // 14) Carregar respostas anteriores
  loadPreviousAnswers() {
    const data = Qry_getAnswersEconomico.data || [];
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
      await Qry_getAnswersEconomico.run();
      this.loadPreviousAnswers();
    }
  },
  
  // 16) Filtro com Estado das Perguntas
  // Fonte de dados de respostas submetidas/persistentes
  answersSource() {
    const rows = Array.isArray(Qry_getAnswersEconomico?.data)
      ? Qry_getAnswersEconomico.data
      : [];
    return rows;
  },

  // Mapa de respostas submetidas/persistentes do utilizador atual (apenas domínio/ano corrente)
  getPersistedAnswersMap() {
    const userId = appsmith.store.autenticacao?.nif || "unknown_user";
    const year = new Date().getFullYear();

    const src = this.answersSource().filter(r =>
      String(r?.id_utilizador || "") === String(userId) &&
      this.normalize(r?.dominio) === "economico" &&
      Number(r?.ano) === year
    );

    const map = {};
    src.forEach(r => {
      const id = String(r?.id_pergunta);
      // Considera "respondida" se r.resposta não é null e não é ""
      map[id] = (r?.resposta === null || r?.resposta === undefined || String(r?.resposta).trim() === "")
        ? ""
        : String(r.resposta).trim();
    });
    return map;
  },

  // Mapa de respostas final (submetidas/persistentes + sessão atual)
  getMergedAnswersMap() {
    const persisted = this.getPersistedAnswersMap();
    const live = this.answers || {};
    // Resposta em memória sobrepõe a submetida/persistente
    return { ...persisted, ...Object.fromEntries(Object.entries(live).map(([k, v]) => [String(k), v || ""])) };
  },

  // Opções do filtro de estado da resposta
  statusOptions() {
    return [
      { label: "Selecionar todas", value: "all" },
      { label: "Respondidas", value: "answered" },
      { label: "Não respondidas", value: "unanswered" }
    ];
  },

  // 17) Filtro categorias 
  // Opções de categorias (ordenadas) com "Selecionar todas"
  categoryOptions() {
    const all = this.getAllFilteredQuestions(); // já traz só domínio "económico" e condicionalidades dos filtros de topo
    const uniq = new Set();
    all.forEach(q => {
      if (q?.categoria) uniq.add(String(q.categoria));
    });
    const cats = Array.from(uniq).sort((a, b) => a.localeCompare(b, "pt", { sensitivity: "base" }));
    // Sentinel "__ALL__" representa "Selecionar todas"
    return [
      { label: "Selecionar todas", value: "__ALL__" },
      ...cats.map(c => ({ label: c, value: c }))
    ];
  },

  // Devolve as categorias a usar (se "__ALL__" estiver presente ou vazio -> todas)
  effectiveCategoryValues() {
    const selected = Multiselect_Categorias?.selectedOptionValues || [];
    const opts = this.categoryOptions().filter(o => o.value !== "__ALL__").map(o => o.value);
    if (selected.length === 0 || selected.includes("__ALL__")) return opts; // todas
    // mantém só as existentes
    return selected.filter(v => opts.includes(v));
  },

  // 18) Visibilidade prguntas formulário
  // Filtragem formulário pós-visibilidade por Categoria + Estado de resposta
  applyUISubFilters(list) {
    const catVals = this.effectiveCategoryValues();
    const mergedAnswers = this.getMergedAnswersMap();
    const status = Select_statusRespostas?.selectedOptionValue || "all";

    return (list || [])
      // Categoria
      .filter(q => !q?.categoria || catVals.includes(String(q.categoria)))
      // Estado de resposta do utilizador
      .filter(q => {
        if (status === "all") return true;
        const id = String(q.id_pergunta);
        const ans = (mergedAnswers[id] || "").trim(); // "Sim"/"Não"/"NA" ou ""
        const isAnswered = ans !== "";
        return status === "answered" ? isAnswered : !isAnswered;
      });
  },

  // Fonte final para o teu List widget (visíveis pela lógica + filtros UI)
  listData() {
    const visible = this.getVisibleQuestions(); // respeita condicionalidade
    return this.applyUISubFilters(visible);
  },

  // 19) Indicador de perguntas respondidas - x/y (z%)
  // Contagens
  // Por omissão: considera apenas perguntas VISÍVEIS pela lógica condicional
  // e aplica o filtro de CATEGORIA. NÃO aplica o filtro de "estado" (senão ficava 100% quando "Respondidas").
  progressCounts() {
    const baseVisible = this.getVisibleQuestions();
    const afterCategory = this.applyUISubFilters(baseVisible.filter(q => q)); // aplica cat + (iremos ignorar status)

    // Ignorar o estado ao calcular -> recontamos sem o pedaço do status
    const catVals = this.effectiveCategoryValues();
    const onlyCat = baseVisible.filter(q => !q?.categoria || catVals.includes(String(q.categoria)));

    const mergedAnswers = this.getMergedAnswersMap();
    const y = onlyCat.length;
    let x = 0;
    onlyCat.forEach(q => {
      const id = String(q.id_pergunta);
      const ans = (mergedAnswers[id] || "").trim();
      if (ans !== "") x += 1;
    });
    const z = y > 0 ? Math.round((x / y) * 100) : 0;
    return { x, y, z };
  },

  // Texto do indicador x/y (z%) ===
  progressText() {
    const { x, y, z } = this.progressCounts();
    return `${x}/${y} (${z}%)`;
  },

  // Valor barra progresso (z%) ===
  perguntasRespondidasPct() {
    const { z } = this.progressCounts();
    const pct = Number(z) || 0;
    return Math.min(100, Math.max(0, pct));
  },

  // 20) Text widget com estado do formulário
  // Usa APENAS as linhas devolvidas pelo query (já filtradas)
  isFormPersistedCompletely() {
    // Conjunto base: perguntas visíveis pela lógica condicional (global)
    const visible = this.getVisibleQuestions();
    if (!Array.isArray(visible) || visible.length === 0) return false;

    // Lê respostas da BD já filtradas (id_utilizador atual, dominio economico, ano = MAX(ano))
    const src = this.answersSource();

    // Criar mapa id_pergunta -> resposta (string não-vazia)
    const persistedMap = {};
    src.forEach(r => {
      const id = String(r?.id_pergunta);
      const val = (r?.resposta === null || r?.resposta === undefined)
        ? ""
        : String(r.resposta).trim();
      persistedMap[id] = val;
    });

    // Todas as VISÍVEIS precisam de resposta SUBMETIDA (não-vazia) na BD
    return visible.every(q => {
      const id = String(q.id_pergunta);
      const ans = (persistedMap[id] || "").trim();
      return ans !== "";
    });
  },

  // Estado local global
  isFormCompleteLocally() {
    const visible = this.getVisibleQuestions();
    const mergedAnswers = this.getMergedAnswersMap();
    if (!Array.isArray(visible) || visible.length === 0) return false;

    return visible.every(q => {
      const id = String(q.id_pergunta);
      const ans = (mergedAnswers[id] || "").trim();
      return ans !== "";
    });
  },

  statusText() {
    const allAnsweredLocally = this.isFormCompleteLocally();
    const allAnsweredPersisted = this.isFormPersistedCompletely();

    if (allAnsweredLocally && allAnsweredPersisted) {
      return "Formulário completo.";
    }
    return "Respostas em falta. Responda a todas as perguntas e submeta o formulário, por favor.";
  },

  //Boolean agregado para estilos de texto
  isFormComplete() {
    return this.isFormCompleteLocally() && this.isFormPersistedCompletely();
  },
};