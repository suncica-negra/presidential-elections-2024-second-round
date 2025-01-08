function getRandomColor() {
    let letters = '0123456789ABCDEF';
    let color = '#';

    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }

    return color;
}

function hexToRgba(hex) {
    let c;

    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');

        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }

        c = `0x${c.join('')}`;
        return `rgba(${[(c>>16)&255, (c>>8)&255, c&255].join(',')},0.1)`;
    } else {
        console.error(`[Elections Widget] It was not possible to create an rgba color because the hex color '${hex}' is not valid`);
    }
}

function placeDataInHtml(electionResults) {
    if (!electionResults || !electionResults.lista) {
        console.error(`[Elections Widget] The 'lista' key within the results is '${electionResults?.lista}' so it is not possible to display the results`);
        return;
    }

    document.getElementById('election_results').replaceChildren();

    const template = document.getElementById('person_data_template');

    if (!template) return;

    const fragment = new DocumentFragment();

    electionResults.lista.slice(0, 2).forEach(candidate => {// briši slice .slice(0, 2)
        const templateClone = template.content.cloneNode(true);
        const percentWrapper = templateClone.querySelector('.percent');
        const percent = candidate.posto;
        if (percentWrapper && percent) percentWrapper.innerText = `${percent}%`;

        const graphSpanColor = candidate.color || getRandomColor();
        let graph = templateClone.querySelector('.graph.mobile');
        let graphSpan = templateClone.querySelector('.graph.mobile span');
        let maxNum = 234;
        let percentInPixel = (Number((percent ? percent : '0').replace(/,/g, '.')) / 100) * maxNum;

        if (window.innerWidth < 900) {
            if (graphSpan) graphSpan.style.height = `${percentInPixel}px`;
        } else {
            graph = templateClone.querySelector('.graph.desk');
            graphSpan = templateClone.querySelector('.graph.desk span');
            maxNum = 260;
            percentInPixel = (Number((percent ? percent : '0').replace(/,/g, '.')) / 100) * maxNum;

            if (graphSpan) graphSpan.style.width = `${percentInPixel}px`;
        }

        const graphColor = hexToRgba(graphSpanColor);
        if (graph) graph.style.backgroundColor = graphColor;
        if (graphSpan) graphSpan.style.backgroundColor = graphSpanColor;

        const img = templateClone.querySelector('img');
        const candidateName = candidate.naziv;
        if (img) {
            img.style.backgroundColor = graphColor;
            img.alt = candidateName;

            if (candidate.image) {
                img.style.backgroundImage = 'url()';
                img.src = candidate.image;
            }
        }

        const name = templateClone.querySelector('.name');
        if (name) name.innerText = candidateName;

        const votes = templateClone.querySelector('.votes');
        if (votes && candidate.glasova) votes.innerText = `Broj glasova: ${Number(candidate.glasova).toLocaleString('hr-HR')}`;

        fragment.appendChild(templateClone);
    });

    const resultsElement = document.getElementById('election_results');
    resultsElement.appendChild(fragment);
}

function setCss() {
    const queryParam = ((new URLSearchParams(window.location.search)).get('portal'))?.toLowerCase();

    if (queryParam === '24sata') {
        document.documentElement.style.setProperty('--fontDefault', 'var(--font24sata)');
        document.documentElement.style.setProperty('--fontTitleDefault', 'var(--fontTitle24sata)');
        document.documentElement.style.setProperty('--titleFontWeightDefault', 'var(--titleFontWeight24sata)');
        document.documentElement.style.setProperty('--backgroundDefault', 'var(--background24sata)');
        document.documentElement.style.setProperty('--titleFontSizeDefault', 'var(--titleFontSize24sata)');
        document.documentElement.style.setProperty('--fontPercentDefault', 'var(--fontPercent24sata)');
        document.documentElement.style.setProperty('--percentFontWeightDefault', 'var(--percentFontWeight24sata)');
    } else if (queryParam === 'vl') {
        document.documentElement.style.setProperty('--fontDefault', 'var(--fontVL)');
        document.documentElement.style.setProperty('--fontTitleDefault', 'var(--fontTitleVL)');
        document.documentElement.style.setProperty('--titleFontWeightDefault', 'var(--titleFontWeightVL)');
        document.documentElement.style.setProperty('--backgroundDefault', 'var(--backgroundVL)');
        document.documentElement.style.setProperty('--titleFontSizeDefault', 'var(--titleFontSizeVL)');
        document.documentElement.style.setProperty('--fontPercentDefault', 'var(--fontPercentVL)');
        document.documentElement.style.setProperty('--percentFontWeightDefault', 'var(--percentFontWeightVL)');
    } else console.error(`[Elections Widget] The font and color are not adjusted because the portal '${queryParam}' is not recognized`);
}

function setLiveOrNot(live) {
    const liveElement = document.querySelector('.live');
    if (liveElement && live) liveElement.style.display = 'flex';
}

function autoRefresh() {
    getElectionsData(true);
}

function setProcessedVotesAndLastChange(vrijeme, bmObradjenoPosto) {
    const destination = document.querySelector('.live_blob');

    if (!destination) return;

    const lastChange = destination.querySelector('#last_change');
    if (lastChange) lastChange.innerText = `Stanje u ${vrijeme}`;

    const processedVotes = destination.querySelector('#processed_votes span');
    if (processedVotes) processedVotes.innerText = `${bmObradjenoPosto}%`;
}

async function getElectionsData(refresh = false) {
    url = 'https://showcase.24sata.hr/izbori2024/presidential-elections-2024.json';

    fetch(url).then((response) => {
        if (response.ok) {
            return response.json();
        }
    })
    .then((responseJson) => {
        responseJson.live = true;//briši
        setLiveOrNot(responseJson.live);
        setProcessedVotesAndLastChange(responseJson.vrijeme, responseJson.bmObradjenoPosto);
        placeDataInHtml(responseJson);

        if (responseJson.live && !refresh) {
            const interval = responseJson.interval || 60000;
            setInterval(autoRefresh, interval);
        }
    })
    .catch((error) => {
        console.error(`[Elections widget] Election results data were not retrieved due to: \n${error}`);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setCss();
    getElectionsData();
});

function debounce(fn, delay) {
    let timer = null;

    return function () {
        const context = this;
        const args = arguments;

        clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(context, args);
        }, delay);
    };
}

window.isMob = window.innerWidth < 900;

window.addEventListener('resize', debounce(() => {
    if (window.innerWidth < 900 !== window.isMob) window.location.reload();
}, 200));
