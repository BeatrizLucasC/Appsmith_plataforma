export default {
  getOption: () => {
    const dominio = "Social";

    // Cores
    const userColor = "#4473CC";   // A minha pontuação
    const mediaColor = "#72A943";  // Pontuação média

    // Nomes das séries / dimensões (para legenda e acesso aos valores)
    const DIM_USER = "A minha pontuação";
    const DIM_MEDIA = "Pontuação média";

    // Ler dados com segurança
    const raw = Array.isArray(Qry_pontuacaoCategoria?.data)
      ? Qry_pontuacaoCategoria.data
      : [];

    const ambientalUser = raw
      .filter((item) => item?.dominio === dominio)
      .map((item) => ({ x: item?.categoria ?? "", y: Number(item?.pontuacao_user) || 0 }));

    const ambientalMedia = raw
      .filter((item) => item?.dominio === dominio)
      .map((item) => ({ x: item?.categoria ?? "", y: Number(item?.pontuacao_media) || 0 }));

    // Categorias (união mantendo ordem)
    const categories = Array.from(
      new Set([...ambientalUser.map((i) => i.x), ...ambientalMedia.map((i) => i.x)])
    );

    // Dataset source com chaves iguais aos nomes das séries (DIM_USER/DIM_MEDIA)
    let source = categories.map((cat) => ({
      categoria: cat,
      [DIM_USER]: ambientalUser.find((i) => i.x === cat)?.y ?? 0,
      [DIM_MEDIA]: ambientalMedia.find((i) => i.x === cat)?.y ?? 0
    }));

    // Ordenar por "A minha pontuação" (desc)
    source = source.sort((a, b) => {
      const av = typeof a[DIM_USER] === "number" ? a[DIM_USER] : Number(a[DIM_USER]) || 0;
      const bv = typeof b[DIM_USER] === "number" ? b[DIM_USER] : Number(b[DIM_USER]) || 0;
      return bv - av;
    });

    const option = {
      color: [userColor, mediaColor],

      // Legenda em cima, sem interação por clique
      legend: {
        top: 0,
        selectedMode: false
      },

      tooltip: {
        trigger: "axis",
        formatter: (params) => {
          const title = params?.[0]?.axisValueLabel ?? "";
          const lines = (params || []).map((p) => {
            // Em dataset mode, p.value é a linha completa; ler pelo seriesName
            const rawVal =
              (p.value && p.seriesName && p.value[p.seriesName]) ??
              p.data ?? 0;
            const num = typeof rawVal === "number" ? rawVal : Number(rawVal) || 0;
            return `${p.marker}${p.seriesName}: <b>${num.toFixed(1)}%</b>`;
          });
          return [title, ...lines].join("<br/>");
        }
      },

      dataset: {
        // Dimensões em PT para coincidirem com os nomes das séries/legenda
        dimensions: ["categoria", DIM_USER, DIM_MEDIA],
        source
      },

      xAxis: {
        type: "category",
        axisLabel: {
          interval: 0,
          width: 120,
          overflow: "break",
          lineHeight: 16,
          formatter: function (value) {
            const maxCharsPerLine = 14;
            const words = String(value).split(" ");
            const lines = [];
            let line = "";
            for (var i = 0; i < words.length; i++) {
              var w = words[i];
              var candidate = (line ? line + " " : "") + w;
              if (candidate.length > maxCharsPerLine) {
                if (line) lines.push(line);
                line = w;
              } else {
                line = candidate;
              }
            }
            if (line) lines.push(line);
            return lines.join("\n");
          }
        }
      },

      yAxis: {
        min: 0,
        max: 100,
        axisLabel: { formatter: (value) => `${value}%` }
      },

      series: [
        {
          type: "bar",
          name: DIM_USER, // legenda e acesso ao valor
          itemStyle: { color: userColor },
          label: {
            show: true,
            position: "top",
            formatter: function (params) {
              var val =
                (params.value && params.seriesName && params.value[params.seriesName]) ??
                params.data ?? 0;
              var num = typeof val === "number" ? val : Number(val) || 0;
              return num.toFixed(1) + "%";
            }
          }
        },
        {
          type: "bar",
          name: DIM_MEDIA, // legenda e acesso ao valor
          itemStyle: { color: mediaColor },
          label: {
            show: true,
            position: "top",
            formatter: function (params) {
              var val =
                (params.value && params.seriesName && params.value[params.seriesName]) ??
                params.data ?? 0;
              var num = typeof val === "number" ? val : Number(val) || 0;
              return num.toFixed(1) + "%";
            }
          }
        }
      ],

      grid: {
        left: 40,
        right: 20,
        top: 50,
        bottom: 80,
        containLabel: true
      }
    };

       return option;
  }
};