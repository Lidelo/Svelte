<div>
    <p>
        Svelte provides a different approach to building web apps than some of the other frameworks covered in this module. While frameworks like React and Vue do the bulk of their work in the user's browser while the app is running, Svelte shifts that work into a compile step that happens only when you build your app, producing highly-optimized vanilla JavaScript.
    </p>
    <p>
        The outcome of this approach is not only smaller application bundles and better performance, but also a developer experience that is more approachable for people that have limited experience of the modern tooling ecosystem.
    </p>
    <p>
        Svelte sticks closely to the classic web development model of HTML, CSS, and JS, just adding a few extensions to HTML and JavaScript. It arguably has fewer concepts and tools to learn than some of the other framework options.
    </p>
    <p>
        W skrócie:
    </p>
        <ul>
            <li>Svelte jest kompilatorem, który kompiluje kod do czystego html, css i prawie czystego JS</li>
            <li>Svelte nie operuje na virtual DOM (który jest dodatkiem do real DOM) tylko na samym real DOM, co znacznie zwiększa prędkość i reaktywność</li>
            <li>Dzięki temu, że Svelte jest tak zbliżony do Vaniliowego JS'a, to jego programy zajmują mało miejsca, więc sa bardzo szybkie, strony są mało obciążone i zmiana parametru na stronie nie wymaga takiego nakładu pracy jak w innych frameworkach</li>
            <li>W Svelte można pisać małe jak i duże aplikacje</li>
            <li>Svelte jest idealny do Single Page Applications</li>
            <li>Każdy plik reprezentuje jeden komponent w Svelte Js + HTMl + CSS. Style z komponentów nie wpływają na siebie</li>
            <li>Oczywiście że powyższy przykład aplikacji TODO działa jak każdy inny, ale on działa bez renderowania, tzn nigdzie w godzie nie mówię aplikacji "ej, coś się zmieniło, przerenderuj się" tylko zmieniam tą wartość i Svelte samo wie które części strony należy zmienić - bez porównywania z poprzednim stanem strony.</li>
        </ul>
</div>

<style>
    li {
        text-align: left;
    }
</style>