export default {
  getOptions: function () {
    const raw = (Qry_pontuacaoIndicador.data || []).filter(it => it && it.dominio === "Ambiental");

    if (!raw.length) {
      return {
        legend: { show: false },
        radar: { indicator: [] },
        series: []
      };
    }

    const wrapByWords = (text, wordsPerLine = 3) => {
      const words = String(text || "").trim().split(/\s+/);
      const lines = [];
      for (let i = 0; i < words.length; i += wordsPerLine) {
        lines.push(words.slice(i, i + wordsPerLine).join(" "));
      }
      return lines.join("\n");
    };

    const items = raw.map(it => {
      const nameFull = String(it.indicador || "").trim();
      const nameWrapped = wrapByWords(nameFull, 3);
      return {
        nameFull,
        nameWrapped,
        valueUser: Number(it.pontuacao_user) || 0,
        valueMedia: Number(it.pontuacao_media) || 0
      };
    });

    const sorted = items.slice().sort((a, b) => b.nameFull.length - a.nameFull.length);
    const half = Math.ceil(sorted.length / 2);
    const longList = sorted.slice(0, half);
    const shortList = sorted.slice(half).reverse();

    const arranged = [];
    const m = Math.max(longList.length, shortList.length);
    for (let i = 0; i < m; i++) {
      if (longList[i]) arranged.push(longList[i]);
      if (shortList[i]) arranged.push(shortList[i]);
    }

    const valuesUser = arranged.map(x => x.valueUser);
    const valuesMedia = arranged.map(x => x.valueMedia);
    const maxCalc = Math.max(10, ...valuesUser, ...valuesMedia);

    const specialNames = {
      "Corretivos do solo": "Corretivos\ndo solo",
      "Áreas Naturais e Áreas de Foco Ecológico": "Áreas Naturais e Áreas\nde Foco Ecológico",
      "Apoio técnico qualificado em gestão de pragas e doenças": "Apoio técnico qualificado em\ngestão de pragas e doenças",
      "Formação especializada em adaptação e mitigação climática": "Formação especializada em adaptação e mitigação climática",
      "Armazenamento, processamento e gestão de restos de calda de aplicação dos fitofármacos": "Armazenamento, processamento e\ngestão de restos de calda\nde aplicação dos fitofármacos",
      "Diversidade Estrutural e Conectividade entre os Ecossistemas": "Diversidade Estrutural e Conectividade\nentre os Ecossistemas",
      "Diversidade e Abundância de fauna e flora": "Diversidade e Abundância\nde fauna e flora",
      "Uso de Tecnologia e Agricultura de Precisão": "Uso de Tecnologia e\nAgricultura de Precisão",
      "Minimizar o risco na aplicação de fitofármacos": "Minimizar o risco na aplicação\nde fitofármacos"
    };

    const indicators = arranged.map(x => ({
      name: specialNames[x.nameFull] || x.nameWrapped,
      max: maxCalc
    }));

    const COLOR_USER = "#5186c5";
    const COLOR_MEDIA = "#15803d";

    // Tooltip só para o indicador atual
    const tooltipFormatter = function (params) {
      if (!params || !params.length) return "";
      const idx = params[0].indicatorIndex ?? params[0].axisIndex ?? 0;
      const item = arranged[idx];
      return (
        "<strong>" + item.nameFull + "</strong><br/>" +
        "A minha pontuação: <b style='color:" + COLOR_USER + "'>" + item.valueUser + "%</b><br/>" +
        "Pontuação média: <b style='color:" + COLOR_MEDIA + "'>" + item.valueMedia + "%</b>"
      );
    };

    return {
      
      tooltip: {
        trigger: "axis", // Mostra ao passar no indicador
        confine: true,
        formatter: tooltipFormatter
      },
      legend: {
        bottom: 10,
        data: ["A minha pontuação", "Pontuação média"]
      },
      radar: {
        radius: "62%",
        splitNumber: 5,
        startAngle: 30,
        nameGap: 45,
        axisName: { color: "#333", fontSize: 11, lineHeight: 11 },
        indicator: indicators
      },
      series: [
        {
          name: "A minha pontuação",
          type: "radar",
          symbol: "circle",
          lineStyle: { width: 2, color: COLOR_USER },
          itemStyle: { color: COLOR_USER },
          areaStyle: { opacity: 0.12 },
          data: [{ value: valuesUser }]
        },
        {
          name: "Pontuação média",
          type: "radar",
          symbol: "circle",
          lineStyle: { width: 2, type: "dashed", color: COLOR_MEDIA },
          itemStyle: { color: COLOR_MEDIA },
          areaStyle: { opacity: 0 },
          data: [{ value: valuesMedia }]
        }
      ]
    };
  }
};