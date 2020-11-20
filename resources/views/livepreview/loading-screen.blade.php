<!doctype html>
<html lang="{{ config('app.locale') }}">
<head>
    @include('statamic::partials.head')
</head>
<body>
    <div class="text-center">
        <div class="m-auto mt-5">
            <svg xmlns="http://www.w3.org/2000/svg"
                width="40px"
                height="40px"
                viewBox="0 0 40 40"
                stroke="#737f8c">
                <g fill="none" fill-rule="evenodd">
                    <g transform="translate(2 2)" stroke-width="4">
                        <circle stroke-opacity=".5" cx="18" cy="18" r="18"/>
                        <path d="M36 18c0-9.94-8.06-18-18-18">
                            <animateTransform
                                attributeName="transform"
                                type="rotate"
                                from="0 18 18"
                                to="360 18 18"
                                dur="1s"
                                repeatCount="indefinite"/>
                        </path>
                    </g>
                </g>
            </svg>

            <div class="mt-1">Aktualisiere Live-Preview</div>
        </div>
    </div> 
</body>
</html>
