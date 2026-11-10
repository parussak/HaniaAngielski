import type {Journey} from '../adventure.ts';
import type {Module,Progress} from '../core.ts';
import {trainingPreparation} from '../learning/training.ts';
import {button,e} from '../ui.ts';

export function trainingPreparationView(modules:Module[],journeys:Journey[],journey:Journey,p:Progress){
    const source=trainingPreparation(modules,journeys,journey,p);
    return `${button('map','← Kocia mapa','back')}<h1>Przygotuj się do treningu</h1><section class="panel training-preparation"><p>Ten trening przypomina materiał wcześniejszych map. Najpierw poznaj go w krótkiej lekcji.</p>${source?`<h2>${e(source.lesson.title)}</h2><p>Mapa: ${e(source.journey.title)}. Przejdź tę lekcję, a potem wróć do treningu na mapie „${e(journey.title)}”. Twoje dotychczasowe postępy i gwiazdki zostają.</p>${button('prepare-training','Poznaj wcześniejszy materiał →')}`:`<p>Wcześniejsza mapa jest chwilowo niedostępna. Zapis treningu pozostaje zachowany; spróbuj ponownie wczytać mapy albo wybierz inne ćwiczenie.</p>${button('retry-maps','Spróbuj wczytać mapy ponownie')}`}</section>${button('journeys','Wybierz inną mapę','secondary')}`;
}
