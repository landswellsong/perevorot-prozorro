<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width,initial-scale=1">
	<meta name="csrf-token" content="{{csrf_token()}}" />
	<title>Prozorro</title>
	<link rel="stylesheet" href="/assets/css/app.css">
	<link rel="stylesheet" href="/assets/css/site.css">
	<!--[if lt IE 9]>
		<script src="/assets/js/legacy/html5shiv.min.js"></script>
		<script src="/assets/js/legacy/respond.min.js"></script>
	<![endif]-->
</head>
<body>

	@yield('content')

	<script src="/assets/js/app.js"></script>
</body>
</html>