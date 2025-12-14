export default {
  getOptions: function () {
    // ---------- 1) Dados ----------
    const raw = (Qry_pontuacaoIndicador.data || []).filter(it => it && it.dominio === "Ambiental");

    if (!raw.length) {
      return {
        tooltip: {
          trigger: "item",
          confine: true,
          triggerOn: "mousemove|click",
          formatter: function (params) {
            const arr = Array.isArray(params.value) ? params.value : [params.value];
            const maxVal = Math.max.apply(null, arr);
            return maxVal > 0 ? params.seriesName + ": " + maxVal + "%" : "";
          }
        },
        legend: { show: false },
        radar: { indicator: [] },
        series: []
      };
    }

    // ---------- 2) Helpers ----------
    const wrapByWords = (text, wordsPerLine = 3) => {
      const words = String(text || "").trim().split(/\s+/);
      const lines = [];
      for (let i = 0; i < words.length; i += wordsPerLine) {
        lines.push(words.slice(i, i + wordsPerLine).join(" "));
      }
      return lines.join("\n");
    };

    // ---------- 3) Itens ----------
    const items = raw.map(it => {
      const nameFull = String(it.indicador || "").trim();
      const nameWrapped = wrapByWords(nameFull, 3);
      const value = Number(it.pontuacao_user) || 0;
      return { nameFull, nameWrapped, value };
    });

    // Reordenar longos / curtos para reduzir colisões
    const sorted = items.slice().sort((a, b) => b.nameFull.length - a.nameFull.length);
    const longList = sorted.slice(0, Math.ceil(sorted.length / 2));
    const shortList = sorted.slice(Math.ceil(sorted.length / 2)).reverse();

    const arranged = [];
    const m = Math.max(longList.length, shortList.length);
    for (let i = 0; i < m; i++) {
      if (longList[i]) arranged.push(longList[i]);
      if (shortList[i]) arranged.push(shortList[i]);
    }

    // ---------- 4) Valores e max ----------
    const values = arranged.map(x => x.value);
    const maxCalc = Math.max(10, ...values);

    // ---------- 5) Indicadores ----------
    const specialNames = {
      "Corretivos do solo": "Corretivos\ndo solo",
      "Áreas Naturais e Áreas de Foco Ecológico": "Áreas Naturais e Áreas\nde Foco Ecológico",
      "Apoio técnico qualificado em gestão de pragas e doenças": "Apoio técnico qualificado em\ngestão de pragas e doenças",
      "Formação especializada em adaptação e mitigação climática": "Formação especializada em adaptação e mitigação climática",
      "Armazenamento, processamento e gestão de restos de calda de aplicação dos fitofármacos": "Armazenamento, processamento e\ngestão de restos de calda\nde aplicação dos fitofármacos",
			"Diversidade Estrutural e Conectividade entre os Ecossistemas": "Diversidade Estrutural e Conectividade\nentre os Ecossistemas",
			"Diversidade e Abundância de fauna e flora":"Diversidade e Abundância\nde fauna e flora",
			"Uso de Tecnologia e Agricultura de Precisão":"Uso de Tecnologia e\nAgricultura de Precisão",
			"Minimizar o risco na aplicação de fitofármacos":"Minimizar o risco na aplicação\nde fitofármacos"
    };

    const indicators = arranged.map(x => ({
      name: specialNames[x.nameFull] || x.nameWrapped,
      max: maxCalc
    }));

    // ---------- 6) Série base ----------
    const baseSeries = {
      name: "Pontuação (geral)",
      type: "radar",
      tooltip: { show: false }, // removida tooltip individual
      areaStyle: { opacity: 0.10 },
      lineStyle: { width: 1.5, color: "#5B8FF9" },
      itemStyle: { color: "#5B8FF9" },
      showSymbol: false,
      data: [{ value: values, name: "Pontuação (geral)" }]
    };

    // ---------- 7) Série por indicador (ponto único) ----------
    const pointSeries = arranged.map((it, idx) => {
      const v = new Array(values.length).fill(0);
      v[idx] = it.value;

      return {
        name: it.nameFull,
        type: "radar",
        lineStyle: { width: 0 },
        areaStyle: { opacity: 0 },
        itemStyle: { color: "#5AD8A6" },
        showSymbol: true,
        symbol: "circle",
        symbolSize: value => {
          const arr = Array.isArray(value) ? value : [value];
          const maxVal = Math.max(...arr);
          return maxVal > 0 ? 10 : 0;
        },
        emphasis: {
          focus: "self",
          label: {
            show: false,
            formatter: p => {
              const arr = Array.isArray(p.value) ? p.value : [p.value];
              const maxVal = Math.max(...arr);
              return maxVal > 0 ? p.seriesName + ": " + maxVal + "%" : "";
            },
            backgroundColor: "rgba(255,255,255,0.95)",
            borderColor: "#999",
            borderWidth: 1,
            borderRadius: 4,
            padding: [4, 6],
            color: "#333"
          }
        },
        data: [{ value: v, name: it.nameFull }]
      };
    });

    // ---------- 8) Retorno ----------
    return {
      tooltip: {
        trigger: "item",
        confine: true,
        triggerOn: "mousemove|click",
        formatter: function (params) {
          const arr = Array.isArray(params.value) ? params.value : [params.value];
          const maxVal = Math.max(...arr);
          return maxVal > 0 ? params.seriesName + ": " + maxVal + "%" : "";
        }
      },
      legend: { show: false },
      radar: {
        radius: "65%",
        splitNumber: 5,
        startAngle: 30,
        nameGap: 45,
        axisName: {
          color: "#333",
          fontSize: 11,
          lineHeight: 11,
          formatter: name => name
        },
        indicator: indicators
      },
      series: [baseSeries, ...pointSeries]
    };
  }
};
