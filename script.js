(function () {
  "use strict";
  var JOBS = [
    { id: "1", title: "Desenvolvedor(a) Front-end Pleno", org: "Nortec Soluções", workMode: "REMOTE", employmentType: "FULL_TIME", city: null, region: null, compensation: 650000, openedAt: "2026-09-08", occupation: { code: "TI", title: "Tecnologia da Informação" } },
    { id: "2", title: "Analista de Recursos Humanos", org: "Grupo Vale Verde", workMode: "ONSITE", employmentType: "FULL_TIME", city: "Nova Lima", region: "MG", compensation: 380000, openedAt: "2026-09-05", occupation: { code: "RH", title: "Recursos Humanos" } },
    { id: "3", title: "Estágio em Marketing Digital", org: "Estúdio Aurora", workMode: "HYBRID", employmentType: "INTERNSHIP", city: "Belo Horizonte", region: "MG", compensation: 150000, openedAt: "2026-09-10", occupation: { code: "MKT", title: "Marketing" } },
    { id: "4", title: "Auxiliar de Logística", org: "Norte Tecnologia", workMode: "ONSITE", employmentType: "FULL_TIME", city: "Contagem", region: "MG", compensation: 220000, openedAt: "2026-08-28", occupation: { code: "LOG", title: "Logística" } },
    { id: "5", title: "Designer de Produto", org: "Estúdio Aurora", workMode: "REMOTE", employmentType: "FULL_TIME", city: null, region: null, compensation: 720000, openedAt: "2026-09-01", occupation: { code: "DSG", title: "Design" } },
    { id: "6", title: "Atendente de Loja", org: "Comercial Bom Preço", workMode: "ONSITE", employmentType: "PART_TIME", city: "Betim", region: "MG", compensation: 160000, openedAt: "2026-08-22", occupation: { code: "ATD", title: "Atendimento ao Cliente" } },
    { id: "7", title: "Assistente Administrativo", org: "Grupo Vale Verde", workMode: "ONSITE", employmentType: "FULL_TIME", city: "Nova Lima", region: "MG", compensation: 280000, openedAt: "2026-09-11", occupation: { code: "ADM", title: "Administração" } },
    { id: "8", title: "Professor(a) de Reforço Escolar", org: "Instituto Caminhos", workMode: "ONSITE", employmentType: "PART_TIME", city: "Belo Horizonte", region: "MG", compensation: null, openedAt: "2026-08-15", occupation: { code: "EDU", title: "Educação" } },
    { id: "9", title: "Técnico(a) de Enfermagem", org: "Rede Saúde Territorial", workMode: "ONSITE", employmentType: "FULL_TIME", city: "Sabará", region: "MG", compensation: 310000, openedAt: "2026-09-03", occupation: { code: "SAU", title: "Saúde" } },
    { id: "10", title: "Aprendiz Administrativo", org: "Norte Tecnologia", workMode: "ONSITE", employmentType: "APPRENTICESHIP", city: "Contagem", region: "MG", compensation: 120000, openedAt: "2026-09-09", occupation: { code: "ADM", title: "Administração" } },
    { id: "11", title: "Engenheiro(a) Civil Júnior", org: "Construtora Horizonte", workMode: "HYBRID", employmentType: "FULL_TIME", city: "Belo Horizonte", region: "MG", compensation: 550000, openedAt: "2026-08-30", occupation: { code: "ENG", title: "Engenharia" } },
    { id: "12", title: "Consultor(a) Comercial", org: "Comercial Bom Preço", workMode: "ONSITE", employmentType: "CONTRACTOR", city: "Betim", region: "MG", compensation: null, openedAt: "2026-09-06", occupation: { code: "VND", title: "Vendas" } },
  ];

  var WORK_MODE_LABEL = { ONSITE: "Presencial", HYBRID: "Híbrido", REMOTE: "Remoto" };
  var EMPLOYMENT_TYPE_LABEL = {
    FULL_TIME: "Tempo integral",
    PART_TIME: "Meio período",
    INTERNSHIP: "Estágio",
    TEMPORARY: "Temporário",
    APPRENTICESHIP: "Aprendizagem",
    CONTRACTOR: "Prestador",
  };

  function locationLabel(job) {
    if (job.workMode === "REMOTE") return "Remoto";
    return [job.city, job.region].filter(Boolean).join(" · ") || "Local a confirmar";
  }

  function compensationLabel(job) {
    if (job.compensation === null) return "A combinar";
    return currency(job.compensation) + " / mês";
  }

  function currency(minor) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(minor / 100);
  }

  function publishedAtLabel(value) {
    return "Publicada em " + new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(value));
  }

  function initials(name) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map(function (word) { return word[0]; })
      .join("")
      .toLocaleUpperCase("pt-BR");
  }

  function escapeHtml(value) {
    var div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
  }

  /* ---------------------------------------------------------------------
   * Estado dos filtros — tudo aplicado localmente, sem navegação.
   * ------------------------------------------------------------------- */
  var pageSize = 5;
  var salaryFilterMax = 20000;
  var salaryFilterStep = 100;

  var state = {
    q: "",
    city: "",
    workMode: null,
    employmentType: null,
    occupations: [],
    salaryMinimum: 0,
    sort: "relevant",
    page: 1,
  };

  var saved = [];
  try {
    var storedSaved = JSON.parse(localStorage.getItem("sit:portal:saved-jobs") || "[]");
    if (Array.isArray(storedSaved)) saved = storedSaved.filter(function (id) { return typeof id === "string"; });
  } catch (err) {
    /* Salvar continua disponível apenas nesta visita quando o storage está indisponível. */
  }

  function toggleSaved(id) {
    var index = saved.indexOf(id);
    if (index === -1) saved.push(id);
    else saved.splice(index, 1);
    try {
      localStorage.setItem("sit:portal:saved-jobs", JSON.stringify(saved));
    } catch (err) {
      /* Navegação privada pode desabilitar o storage. */
    }
    renderResults();
  }

  /* ---------------------------------------------------------------------
   * Filtros (renderizados nas duas cópias: mobile e desktop).
   * ------------------------------------------------------------------- */
  var areas = (function () {
    var seen = {};
    var list = [];
    JOBS.forEach(function (job) {
      if (!seen[job.occupation.code]) {
        seen[job.occupation.code] = true;
        list.push(job.occupation);
      }
    });
    return list;
  })();

  function hasFilters() {
    return Boolean(state.q || state.city || state.workMode || state.employmentType || state.salaryMinimum > 0);
  }

  function filterGroupHtml(idPrefix, title, iconSvg, group, options) {
    var html = '<fieldset class="space-y-3"><legend class="flex items-center gap-2 text-sm font-medium">' +
      '<span class="text-muted-foreground [&_svg]:size-4">' + iconSvg + "</span>" + title + "</legend>" +
      '<div class="space-y-2.5">';
    options.forEach(function (opt) {
      var id = idPrefix + "-" + group + "-" + opt[0];
      var checked = state[group] === opt[0] ? "checked" : "";
      html += '<label for="' + id + '" class="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground">' +
        '<input type="checkbox" id="' + id + '" data-group="' + group + '" data-value="' + opt[0] + '" ' + checked +
        ' class="size-4 shrink-0 rounded border-border/70 accent-primary" />' + opt[1] + "</label>";
    });
    html += "</div></fieldset>";
    return html;
  }

  function areaOptionHtml(idPrefix, area) {
    var id = idPrefix + "-occupation-" + area.code;
    var checked = state.occupations.indexOf(area.code) !== -1 ? "checked" : "";
    return '<label for="' + id + '" class="flex cursor-pointer items-start gap-3 text-sm text-muted-foreground">' +
      '<input type="checkbox" id="' + id + '" data-group="occupation" data-value="' + area.code + '" ' + checked +
      ' class="mt-0.5 size-4 shrink-0 accent-primary" />' + area.title + "</label>";
  }

  function salaryLabel(reais) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(reais);
  }

  function filtersFormHtml(idPrefix) {
    var salaryValue = state.salaryMinimum;
    var salaryText = salaryValue === 0 ? "Qualquer valor" : "A partir de " + salaryLabel(salaryValue);

    var firstAreas = areas.slice(0, 5);
    var restAreas = areas.slice(5);

    var html = '<search class="block"><form class="space-y-6" data-role="filters-form">';

    html += '<div class="relative">' +
      '<label for="' + idPrefix + '-search" class="sr-only">Buscar</label>' +
      '<svg class="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>' +
      '<input id="' + idPrefix + '-search" data-field="q" type="search" minlength="2" maxlength="120" value="' + escapeHtml(state.q) + '" placeholder="Cargo ou empresa" class="h-10 w-full rounded-xl border border-border/70 bg-card pl-9 pr-3 text-sm text-foreground shadow-none outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20" />' +
      "</div>";

    html += '<div class="space-y-3">' +
      '<label for="' + idPrefix + '-city" class="flex items-center gap-2 text-sm font-medium">' +
      '<svg class="size-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>Localização</label>' +
      '<input id="' + idPrefix + '-city" data-field="city" maxlength="120" value="' + escapeHtml(state.city) + '" placeholder="Ex.: Nova Lima" class="h-10 w-full rounded-xl border border-border/70 bg-card px-3 text-sm text-foreground shadow-none outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20" />' +
      "</div>";

    html += '<div class="space-y-3">' +
      '<div class="flex items-center justify-between gap-2">' +
      '<label for="' + idPrefix + '-salary" class="flex items-center gap-2 text-sm font-medium">' +
      '<svg class="size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 14h.01"/><path d="M7 7h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/><path d="M5 7V5a2 2 0 0 1 2-2h10"/></svg>Pretensão salarial</label>' +
      '<span class="text-sm font-semibold text-primary" data-role="salary-live-label">' + salaryText + "</span></div>" +
      '<input id="' + idPrefix + '-salary" data-field="salary" type="range" min="0" max="' + salaryFilterMax + '" step="' + salaryFilterStep + '" value="' + salaryValue + '" class="h-2 w-full cursor-pointer rounded-full" />' +
      '<div class="flex justify-between text-xs text-muted-foreground"><span>R$ 0</span><span>' + salaryLabel(salaryFilterMax) + "+</span></div>" +
      '<p class="text-xs leading-5 text-muted-foreground">Faixas divulgadas em reais por mês que alcancem esse valor.</p>' +
      "</div>";

    html += filterGroupHtml(idPrefix, "Modelo de trabalho",
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 12h.01"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M22 13a18.15 18.15 0 0 1-20 0"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>',
      "workMode", [["ONSITE", "Presencial"], ["HYBRID", "Híbrido"], ["REMOTE", "Remoto"]]);

    if (areas.length) {
      html += '<fieldset class="space-y-3"><legend class="mb-3 flex items-center gap-2 text-sm font-semibold">' +
        '<svg class="size-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>Área de atuação</legend>';
      firstAreas.forEach(function (area) { html += areaOptionHtml(idPrefix, area); });
      if (restAreas.length) {
        html += '<details><summary class="cursor-pointer text-sm text-primary">Mostrar mais</summary><div class="mt-3 space-y-3">';
        restAreas.forEach(function (area) { html += areaOptionHtml(idPrefix, area); });
        html += "</div></details>";
      }
      html += "</fieldset>";
    }

    html += filterGroupHtml(idPrefix, "Tipo de oportunidade",
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>',
      "employmentType", [["FULL_TIME", "Tempo integral"], ["PART_TIME", "Meio período"], ["INTERNSHIP", "Estágio"], ["TEMPORARY", "Temporário"], ["APPRENTICESHIP", "Aprendizagem"], ["CONTRACTOR", "Prestador"]]);

    html += '<div class="space-y-2">' +
      '<button type="submit" class="inline-flex h-9 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90">' +
      '<svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>Buscar vagas</button>';
    if (hasFilters() || state.occupations.length) {
      html += '<button type="button" data-role="clear-filters" class="inline-flex h-9 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] px-4 text-sm font-medium hover:bg-accent hover:text-accent-foreground">Limpar filtros</button>';
    }
    html += "</div></form></search>";
    return html;
  }

  function renderFilters() {
    ["mobile", "desktop"].forEach(function (idPrefix) {
      var slot = document.querySelector('[data-filters-slot="' + idPrefix + '"]');
      if (!slot) return;
      slot.innerHTML = filtersFormHtml(idPrefix);
      wireFilters(slot, idPrefix);
    });
  }

  function wireFilters(root, idPrefix) {
    var form = root.querySelector('[data-role="filters-form"]');
    form.addEventListener("submit", function (event) {
      event.preventDefault();
    });

    var searchInput = root.querySelector('[data-field="q"]');
    searchInput.addEventListener("input", debounce(function () {
      state.q = searchInput.value;
      state.page = 1;
      renderResults();
    }, 300));

    var cityInput = root.querySelector('[data-field="city"]');
    cityInput.addEventListener("input", debounce(function () {
      state.city = cityInput.value;
      state.page = 1;
      renderResults();
    }, 300));

    var salaryInput = root.querySelector('[data-field="salary"]');
    var salaryLiveLabel = root.querySelector('[data-role="salary-live-label"]');
    salaryInput.addEventListener("input", function () {
      var value = Number(salaryInput.value);
      salaryLiveLabel.textContent = value === 0 ? "Qualquer valor" : "A partir de " + salaryLabel(value);
    });
    salaryInput.addEventListener("change", function () {
      state.salaryMinimum = Number(salaryInput.value);
      state.page = 1;
      renderFilters();
      renderResults();
    });

    root.querySelectorAll("input[data-group]").forEach(function (input) {
      input.addEventListener("change", function () {
        var group = input.getAttribute("data-group");
        var value = input.getAttribute("data-value");
        if (group === "occupation") {
          var index = state.occupations.indexOf(value);
          if (input.checked && index === -1) state.occupations.push(value);
          else if (!input.checked && index !== -1) state.occupations.splice(index, 1);
        } else {
          state[group] = input.checked ? value : null;
        }
        state.page = 1;
        renderFilters();
        renderResults();
      });
    });

    var clearButton = root.querySelector('[data-role="clear-filters"]');
    if (clearButton) {
      clearButton.addEventListener("click", function () {
        state.q = "";
        state.city = "";
        state.workMode = null;
        state.employmentType = null;
        state.occupations = [];
        state.salaryMinimum = 0;
        state.page = 1;
        renderFilters();
        renderResults();
      });
    }
  }

  function debounce(fn, wait) {
    var timer;
    return function () {
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(null, args); }, wait);
    };
  }

  /* ---------------------------------------------------------------------
   * Resultados: contagem, ordenação, paginação, cartões, estado vazio.
   * Os cartões não abrem uma vaga específica — sem link para detalhe ou
   * candidatura por enquanto.
   * ------------------------------------------------------------------- */
  function computeJobs() {
    var q = state.q.trim().toLowerCase();
    var city = state.city.trim().toLowerCase();

    var filtered = JOBS.filter(function (job) {
      if (q && job.title.toLowerCase().indexOf(q) === -1 && job.org.toLowerCase().indexOf(q) === -1) return false;
      if (city && !(job.city || "").toLowerCase().includes(city)) return false;
      if (state.workMode && job.workMode !== state.workMode) return false;
      if (state.employmentType && job.employmentType !== state.employmentType) return false;
      if (state.occupations.length && state.occupations.indexOf(job.occupation.code) === -1) return false;
      if (state.salaryMinimum > 0) {
        if (job.compensation === null || job.compensation < state.salaryMinimum * 100) return false;
      }
      return true;
    });

    var ordered = filtered.slice().sort(function (a, b) {
      if (state.sort === "recent") return Date.parse(b.openedAt) - Date.parse(a.openedAt);
      if (state.sort === "title") return a.title.localeCompare(b.title, "pt-BR");
      return 0;
    });

    return ordered;
  }

  function jobCardHtml(job) {
    var isSaved = saved.indexOf(job.id) !== -1;
    var saveButton = '<button type="button" data-save="' + job.id + '" class="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground hover:bg-accent hover:text-primary" aria-pressed="' + isSaved + '" aria-label="' + (isSaved ? "Remover vaga salva" : "Salvar vaga") + ": " + escapeHtml(job.title) + '" title="Salvar neste navegador">' +
      '<svg class="size-4" viewBox="0 0 24 24" fill="' + (isSaved ? "currentColor" : "none") + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></button>';

    return '<article class="rounded-2xl border border-border/60 bg-card p-5 transition-shadow hover:border-primary/25 hover:shadow-sm sm:p-6">' +
      '<div class="flex gap-4 sm:gap-6">' +
      '<span aria-hidden="true" class="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-muted/60 text-base font-semibold text-primary">' + escapeHtml(initials(job.org)) + "</span>" +
      '<div class="min-w-0 flex-1">' +
      '<div class="flex items-start justify-between gap-2">' +
      '<p class="text-sm text-muted-foreground">' + escapeHtml(job.org) + "</p>" +
      '<span class="sm:hidden">' + saveButton + "</span>" +
      "</div>" +
      '<h2 class="mt-1 line-clamp-2 text-base font-semibold leading-6 text-foreground">' + escapeHtml(job.title) + "</h2>" +
      '<div class="mt-2 flex flex-wrap gap-1.5">' +
      '<span class="inline-flex items-center rounded-md bg-muted/70 px-2.5 py-0.5 text-xs font-normal text-muted-foreground">' + WORK_MODE_LABEL[job.workMode] + "</span>" +
      '<span class="inline-flex items-center rounded-md bg-muted/70 px-2.5 py-0.5 text-xs font-normal text-muted-foreground">' + EMPLOYMENT_TYPE_LABEL[job.employmentType] + "</span>" +
      "</div>" +
      '<div class="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">' +
      '<span class="inline-flex items-center gap-1.5"><svg class="size-4 shrink-0 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>' + escapeHtml(locationLabel(job)) + "</span>" +
      "</div>" +
      '<div class="mt-3 flex flex-wrap items-center justify-between gap-3 sm:hidden">' +
      '<div class="space-y-1"><p class="text-sm font-medium">' + compensationLabel(job) + "</p>" +
      '<time datetime="' + job.openedAt + '" class="text-xs text-muted-foreground">' + publishedAtLabel(job.openedAt) + "</time></div>" +
      "</div>" +
      "</div>" +
      '<div class="hidden w-60 shrink-0 flex-col items-end justify-between gap-3 sm:flex">' +
      '<div class="flex w-full items-start justify-between gap-2">' +
      '<div><p class="text-sm font-medium">' + compensationLabel(job) + "</p>" +
      '<div class="mt-1"><time datetime="' + job.openedAt + '" class="text-xs text-muted-foreground">' + publishedAtLabel(job.openedAt) + "</time></div></div>" +
      saveButton +
      "</div>" +
      "</div>" +
      "</div>" +
      "</article>";
  }

  function renderResults() {
    var ordered = computeJobs();
    var pageCount = Math.max(1, Math.ceil(ordered.length / pageSize));
    var currentPage = Math.min(state.page, pageCount);
    state.page = currentPage;
    var pageJobs = ordered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    var countEl = document.getElementById("job-count");
    countEl.textContent = ordered.length + (ordered.length === 1 ? " vaga encontrada" : " vagas encontradas");

    var salaryChip = document.getElementById("salary-chip");
    if (state.salaryMinimum > 0) {
      salaryChip.classList.remove("hidden");
      salaryChip.classList.add("flex");
      document.getElementById("salary-chip-label").textContent = "A partir de " + salaryLabel(state.salaryMinimum) + " / mês";
    } else {
      salaryChip.classList.add("hidden");
      salaryChip.classList.remove("flex");
    }

    var listEl = document.getElementById("job-list");
    listEl.innerHTML = pageJobs.map(jobCardHtml).join("");
    listEl.querySelectorAll("[data-save]").forEach(function (button) {
      button.addEventListener("click", function () {
        toggleSaved(button.getAttribute("data-save"));
      });
    });

    var emptyEl = document.getElementById("job-empty");
    if (!ordered.length) {
      emptyEl.classList.remove("hidden");
      emptyEl.classList.add("grid");
    } else {
      emptyEl.classList.add("hidden");
      emptyEl.classList.remove("grid");
    }

    renderPagination(ordered.length, pageCount, currentPage);
  }

  function renderPagination(total, pageCount, currentPage) {
    var wrap = document.getElementById("job-pagination");
    if (!total) {
      wrap.innerHTML = "";
      return;
    }
    var start = (currentPage - 1) * pageSize + 1;
    var end = Math.min(currentPage * pageSize, total);

    var buttons = '<nav class="flex flex-wrap gap-1" aria-label="Paginação das vagas">';
    buttons += pageButton("‹", "Página anterior", currentPage - 1, currentPage === 1);
    for (var i = 1; i <= pageCount; i++) {
      buttons += pageButton(String(i), "Página " + i, i, false, i === currentPage);
    }
    buttons += pageButton("›", "Próxima página", currentPage + 1, currentPage === pageCount);
    buttons += "</nav>";
    buttons += '<p class="text-xs text-muted-foreground">Mostrando ' + start + "–" + end + " de " + total + " vagas</p>";
    wrap.innerHTML = buttons;

    wrap.querySelectorAll("[data-page]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.page = Number(button.getAttribute("data-page"));
        renderResults();
        document.getElementById("jobs-top")?.scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  function pageButton(label, ariaLabel, page, disabled, active) {
    var base = "inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-sm font-medium transition-colors";
    var style = active ? " bg-primary text-primary-foreground shadow-xs" : " hover:bg-accent hover:text-accent-foreground";
    var disabledAttr = disabled ? " disabled" : "";
    var disabledStyle = disabled ? " disabled:pointer-events-none disabled:opacity-50" : "";
    return '<button type="button" data-page="' + page + '" aria-label="' + ariaLabel + '"' + (active ? ' aria-current="page"' : "") +
      ' class="' + base + style + disabledStyle + '"' + disabledAttr + ">" + label + "</button>";
  }

  document.getElementById("salary-chip-clear").addEventListener("click", function () {
    state.salaryMinimum = 0;
    state.page = 1;
    renderFilters();
    renderResults();
  });

  document.getElementById("job-empty-clear").addEventListener("click", function () {
    state.q = "";
    state.city = "";
    state.workMode = null;
    state.employmentType = null;
    state.occupations = [];
    state.salaryMinimum = 0;
    state.page = 1;
    renderFilters();
    renderResults();
  });

  document.getElementById("job-sort").addEventListener("change", function (event) {
    state.sort = event.target.value;
    state.page = 1;
    renderResults();
  });

  /* CTAs sem destino habilitado (login / minha conta) ainda não navegam. */
  document.querySelectorAll('a[href="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
    });
  });

  renderFilters();
  renderResults();
})();
