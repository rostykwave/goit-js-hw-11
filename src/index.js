import './sass/main.scss';

///////Бібліотека SimpleLightbox
import SimpleLightbox from "simplelightbox";
import "simplelightbox/dist/simple-lightbox.min.css";
// Створення і налаштування нового LightBox
let lightbox = new SimpleLightbox('.gallery a', {
    captions: true,
    captionSelector: 'img',
    captionType: 'attr',
    captionsData: 'alt',
    captionPosition: 'bottom',
    captionDelay: 250,
});
/////

//Notifix
import { Notify } from 'notiflix/build/notiflix-notify-aio';
//Templates
import photoCardTpl from './templates/photo-card.hbs'


///BackEnd
// import API from './js/api-service';
import PhotoApiService from './js/api-service';
import LoadButton from './js/load-more-button';


//Refs
import getRefs from './js/getRefs';
const refs = getRefs();

///копія класу
const photoApiService = new PhotoApiService(); 
const loadMoreButton = new LoadButton(
    {
        selector: '.load-more',
        hidden: true,
    }
);
const searchQueryButton = new LoadButton({
    selector: '.search-form__button',
});
////


refs.form.addEventListener('submit', onSearch);
loadMoreButton.refs.button.addEventListener('click', fetchCards);


//////////Observer
const callback = (entries, io) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      console.log(`Спостергаю за id ="${entry.target.id}"`);
        fetchCards();
        Notify.info('Loading...');
    }
  });
};
const options = {
  rootMargin: '100px',
  // threshold: 0.5,
};
const observer = new IntersectionObserver(callback, options);

const sentinel = document.querySelector('#sentinel');
// observer.observe(sentinel);
/////////////////////////////////////////////////////////////////



function onSearch(e) {
    e.preventDefault();

    // loadMoreButton.hide();

    photoApiService.query = e.currentTarget.elements.searchQuery.value;

    if (photoApiService.query === '') {
        return Notify.info('Введть свій запит в поле пошуку');
    }

    photoApiService.resetPage();
    clearCardsContainer();

    searchQueryButton.disable();

    // fetchCards();

    observer.observe(sentinel);

}


function fetchCards() {
    // loadMoreButton.disable();

    photoApiService.fetchCards()
        .then(cards => {
            // loadMoreButton.show();
            renderPhotoCards(cards);
            lightbox.refresh();
            searchQueryButton.enable();
            
        })
        .catch(onFetchError)
        .finally(console.log('fetch done'));
}


///Функція отримує масив з об'єктами, які містять дані кожної картрки
function renderPhotoCards({ dataHits, totalHits, PER_PAGE, currentPage }) {
//Варіант 1
    const currentHits = dataHits.length;

    console.log(dataHits);

    ////Якщо бекенд повертає порожній масив, значить нічого підходящого не було знайдено
    if (currentHits === 0) {
        return Notify.warning("Sorry, there are no images matching your search query. Please try again.");
    }

    refs.cardContainer.insertAdjacentHTML('beforeend', photoCardTpl(dataHits));

    if (currentPage !== 1) {
        smoothScroll();
    }


    ///Додатково: Після першого запиту з кожним новим пошуком отримувати повідомлення, в якому буде написано, скільки всього знайшли зображень (властивість totalHits). 
    totalHitsOnSearchNotif({ currentPage, totalHits });

    loadMoreButton.enable();


    // Якщо користувач дійшов до кінця колекції, ховай кнопку і виводь повідомлення з текстом
     if (currentPage === Math.ceil(totalHits / PER_PAGE)) {
         console.log('END');
         loadMoreButton.hide();
         
         return Notify.warning("We're sorry, but you've reached the end of search results.");
    }

    
 //Варіант 2 для створення макету
    ///Цей варіант занадто накручений, конструкція each в шаблонах  не потрібна
    // ///Створення пустого масиву
    // const markup = [];

    // ////Ітерація по масиву стільки разів, скільки прийшло відповіді з бекенду
    // for (let i = 0; i < photo.hits.length; i += 1) {
    //     //додавання згенерованого HTML-карток в масив
    // markup.push(photoCardTpl(photo.hits[i]));
    // }

    // ///Об'єднання масиву в один рядок
    // const markupList = markup.join('');
    // ///Вставлення списку HTML всіх згенерованих карток в галерею
    // refs.cardContainer.insertAdjacentHTML('beforeend', markupList);
}

function onFetchError(error) {
    Notify.failure("Sorry, there is some error");
}

function clearCardsContainer() {
    refs.cardContainer.innerHTML = '';
}


///Додатково

function totalHitsOnSearchNotif({currentPage, totalHits}) {

      if (currentPage === 1) {
        Notify.info(`Hooray! We found ${totalHits} images.`);
        "Hooray! We found totalHits images."
    }

}

//Додатково. Прокручування сторінки
function smoothScroll() {
    const { height: cardHeight } = document
  .querySelector(".gallery")
  .firstElementChild.getBoundingClientRect();

window.scrollBy({
  top: cardHeight * 2,
  behavior: "smooth",
});
}



/////addition
// function endOfScroll() {
//     const myDiv = document.querySelector('.gallery');  
//     myDiv.addEventListener('scroll', () => {
//         if (myDiv.offsetHeight + myDiv.scrollTop >= myDiv.scrollHeight) {
//             console.log('scrolled to bottom')
//         }
//     });
// }
////



//1. Зробити, щоб повідомлення про "We're sorry, but you've reached the end of search results." показувалось тільки після прокручування до кінця сторіники
//2.Нескінченний скрол


