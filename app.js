const BASE_URL = "https://api.harvardartmuseums.org";
const KEY = "apikey=a4b1b6c8-0b60-48f8-a7b1-0b2c95c52202";

// FETCH FUNCTIONS

async function fetchObjects() {
  const url = `${BASE_URL}/object?${KEY}`;
  onFetchStart();

  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data.info);
    return data;
  } catch (error) {
    console.error(error);
  } finally {
    onFetchEnd();
  }
}

async function fetchAllCenturies() {
  const url = `${BASE_URL}/century?${KEY}&size=100&sort=temporalorder`;

  if (localStorage.getItem("centuries")) {
    return JSON.parse(localStorage.getItem("centuries"));
  }

  try {
    onFetchStart();
    const response = await fetch(url);
    const data = await response.json();
    const records = data.records;
    localStorage.setItem("centuries", JSON.stringify(records));
    return records;
  } catch (error) {
    console.error(error);
  } finally {
    onFetchEnd();
  }
}

async function fetchAllClassifications() {
  const url = `${BASE_URL}/classification?${KEY}&size=100&sort=name`;

  if (localStorage.getItem("classifications")) {
    return JSON.parse(localStorage.getItem("classifications"));
  }

  try {
    onFetchStart();
    const response = await fetch(url);
    const data = await response.json();
    const records = data.records;
    localStorage.setItem("classifications", JSON.stringify(records));
    return records;
  } catch (error) {
    console.log(error);
  } finally {
    onFetchEnd();
  }
}

async function prefetchCategoryLists() {
  try {
    const [classifications, centuries] = await Promise.all([
      fetchAllClassifications(),
      fetchAllCenturies(),
    ]);

    $(".classification-count").text(`(${classifications.length})`);

    classifications.forEach((classification) => {
      const { name } = classification;
      const optionElement = `<option value="${name}">${name}</option>`;
      $("#select-classification").append(optionElement);
    });

    $(".century-count").text(`(${centuries.length})`);

    centuries.forEach((century) => {
      const { name } = century;
      const optionElement = `<option value="${name}">${name}</option>`;
      $("#select-century").append(optionElement);
    });
  } catch (error) {
    console.error(error);
  }
}

function onFetchStart() {
  $("#loading").addClass("active");
}

function onFetchEnd() {
  $("#loading").removeClass("active");
}

// RENDER FUNCTIONS

function buildSearchString() {
  const classification = $("#select-classification").val();
  const century = $("#select-century").val();
  const keywords = $("#keywords").val();
  return `${BASE_URL}/object?${KEY}&classification=${classification}&century=${century}&keyword=${keywords}`;
}

//need to fix this. dont render element at all if there isnt a value
// function renderPreview(record) {
//   const { desciption, primaryimageurl, title } = record;
//   const previewElement = $(`<div class="object-preview">
// 				<a href="#">
// 				<img src= ${primaryimageurl ? primaryimageurl : ""}/>
// 				<h3>${title ? title : ""} </h3>
// 				<h3>${desciption ? desciption : ""}</h3>
// 				</a>
// 			</div>`);
//   previewElement.data("record", record);
//   return previewElement;
// }

function renderPreview(record) {
  const { description, primaryimageurl, title } = record;
  return $(`${`<div class="object-preview">
				<a href="#">
				${ primaryimageurl ? `<img src="${primaryimageurl}"/>` : ""}
				<h3>${title ? title : ""} </h3>
				</a>
				<h3 class="description">${description ? description : ""}</h3>
			</div>`}`).data("record", record);
}

function updatePreview(data) {
  const { info, records } = data;
  const root = $("#preview"); //??
  const results = $(".results");
  results.empty();

  const next = $(".next");
  if (info.next) {
    next.data("next", info.next);
    console.log(next.data());
    next.prop("disabled", false);
  } else {
    next.data(null);
    next.prop("disabled", true);
  }

  const previous = $(".previous");
  if (info.prev) {
    console.log(info.prev);
    previous.data("previous", info.prev);
    previous.prop("disabled", false);
  } else {
    previous.data(null);
    previous.prop("disabled", true);
  }

  records.forEach((record) => results.append(renderPreview(record)));
}

function renderFeature(record) {
  const {
    title,
    dated,
    desciption,
    culture,
    style,
    technique,
    medium,
    dimensions,
    people,
    department,
    division,
    contact,
    creditline,
    images,
    primaryimageurl,
  } = record;

  return $(`<div class="object-feature">
	<header>
	<h3>${title}</h3>
	<h4>${dated}</h4>
	</header>
	<section class="facts">
	${factHTML("Description", desciption)}
	${factHTML("Culture", culture, "culture")}
	${factHTML("Style", style)}
	${factHTML("Technique", technique, "technique")}
	${factHTML("Medium", medium, "medium")}
	${factHTML("Dimensions", dimensions)}
	${
    people
      ? people
          .map((person) => {
            return factHTML("Person", person.displayname, "person");
          })
          .join("")
      : ""
  }
	${factHTML("Department", department)}
	${factHTML("Division", division)}
	${factHTML(
    "Contact",
    `<a target="_blank" href="mailto:${contact}">${contact}</a>`
  )}
	${factHTML("Creditline", creditline)}
	</section>
	<section class="photos">
	${photosHTML(images, primaryimageurl)}
	</section>
	</div>`);
}

function searchURL(searchType, searchString) {
  return `${BASE_URL}/object?${KEY}&${searchType}=${searchString}`;
}

function factHTML(title, content, searchTerm = null) {
  return `${
    content && !searchTerm
      ? `
      <span class="title">${title}</span>
			<span class="content">${content}</span>`
      : content
      ? `
      <span class="title">${title}</span>
			<span class="content"><a href="${searchURL(
        searchTerm,
        content
      )}">${content}</a></span>`
      : ""
  }`;
}

function photosHTML(images, primaryimageurl) {
  return `${
    images && images.length > 0
      ? images
          .map((image) => {
            return `<img src="${image.baseimageurl}"/>`;
          })
          .join("")
      : primaryimageurl
      ? `<img src="${primaryimageurl}"/>`
      : ""
  }`;
}

prefetchCategoryLists();

// CLICK FUNCTIONS

$("#search").on("submit", async function (event) {
  event.preventDefault();
  try {
    const encodedUrl = encodeURI(buildSearchString());
    const result = await fetch(encodedUrl);
    const data = await result.json();
    updatePreview(data);
  } catch (error) {
    console.log(error);
  }
});

$("#preview .next, #preview .previous").on("click", async function () {
  onFetchStart();
  try {
    let url, response, data;
    if ($(this).data("next")) {
      url = $(".next").data().next;
      response = await fetch(url);
      data = await response.json();
    } else {
      url = $(".previous").data().previous;
      response = await fetch(url);
      data = await response.json();
    }
    updatePreview(data);
  } catch (error) {
    console.log(error);
  } finally {
    onFetchEnd();
  }
});

$("#preview").on("click", ".object-preview", function (event) {
  event.preventDefault(); // they're anchor tags, so don't follow the link
  const target = $(this).closest(".object-preview");
  const data = target.data("record");
  console.log(data);
});

$("#preview").on("click", ".object-preview", function (event) {
  event.preventDefault();
  const record = $(this).data("record");
  $("#feature").html(renderFeature(record));
});

$("#feature").on("click", "a", async function (event) {
	const href = $(this).attr("href");
	if (href.startsWith('mailto')) { return; }
  event.preventDefault();
  onFetchStart();
  const result = await fetch(href);
  const data = await result.json();
  console.log(data);
  updatePreview(data);
  onFetchEnd();
});
