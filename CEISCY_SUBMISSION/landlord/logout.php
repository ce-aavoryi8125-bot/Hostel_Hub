<?php
session_start();
unset($_SESSION['landlord_id']);
unset($_SESSION['landlord_name']);
unset($_SESSION['landlord_business']);
unset($_SESSION['landlord_email']);
session_destroy();

header('Location: login.php');
exit;
