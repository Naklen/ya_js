let input = document.querySelector('.input');

let suggestBlock = document.querySelector('.suggest-block');

let onKeyDown = debounce(function (e) {
    if ((e.code >= 'KeyA' && e.code <= 'KeyZ') || /BracketLeft|BracketRight|Semicolon|Quote|Comma|Period|Slash|Minus|Space|Backspace/.test(e.code)) {        
        makeRequest(input.value).then(data => {
            showSuggest(getSuggestList(data));
        });
    }
}, 300);

input.addEventListener('keydown', onKeyDown);

/** 
 * @param {Array<string>} suggestList 
 */
function showSuggest(suggestList) {
    suggestBlock.innerHTML = '';
    let count = (suggestList.length > 6) ? 6 : suggestList.length;
    if (suggestList.length !== 0) {
        for (let i = 0; i < count; i++) {
            let suggest = document.createElement('span');
            suggest.className = 'suggest-block__item';
            suggest.innerHTML = suggestList[i];
            suggest.addEventListener('click', () => {
                input.value = suggest.innerHTML;
                suggestBlock.innerHTML = '';
                suggestBlock.style.display = 'none';
                input.removeAttribute('style');
            });
            suggestBlock.appendChild(suggest);
        }
        input.style['border-bottom-left-radius'] = '0';
        input.style['border-bottom-right-radius'] = '0';
        suggestBlock.style.display = 'flex';
    }
    else {
        input.removeAttribute('style');
        suggestBlock.style.display = 'none';
    }   
}

async function makeRequest(request) {
    if (request !== '') {
        let response = await fetch(`http://autocomplete.travelpayouts.com/places2?term=${request}&locale=ru&types[]=city,airport`);
        if (response.ok)
            return response.json();
    }
}

function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction() {
        const context = this;
        const args = arguments;
        const later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

function getSuggestList(data) {
    let result = [];
    if (data) {
        for (let item of data) {
            let resItem = item.name;
            if (item.type === 'airport') {
                if (item.name === item.city_name)
                    continue;
                resItem += ` (${item.city_name})`;
            }
            resItem += ` ${item.code}`;
            result.push(resItem);
        }
        return result;
    }
    else return [];
}

window.addEventListener('keydown', function (e) {
    if (suggestBlock.style.display !== 'none')
    {
        let focused = suggestBlock.querySelector('.focused');
        if (e.code === 'ArrowDown' || e.code === 'ArrowUp') { 
            e.preventDefault();
            if (focused === null) {
                if (e.code === 'ArrowDown')
                    suggestBlock.firstChild.classList.add('focused');
                else
                    suggestBlock.lastChild.classList.add('focused');
            }
            else {
                focused.classList.remove('focused');
                if (e.code === 'ArrowDown') {
                    if (suggestBlock.lastChild === focused)
                        suggestBlock.firstChild.classList.add('focused');
                    else
                        focused.nextSibling.classList.add('focused');
                }
                else {
                    if (suggestBlock.firstChild === focused)
                        suggestBlock.lastChild.classList.add('focused');
                    else
                        focused.previousSibling.classList.add('focused');
                }
            }
        }
        if (e.code === "Enter" || e.code === "Tab") {
            if (focused !== null) {
                input.value = focused.innerHTML;
                suggestBlock.innerHTML = '';
                input.removeAttribute('style');
                suggestBlock.style.display = 'none';
            }
        }
    }
});