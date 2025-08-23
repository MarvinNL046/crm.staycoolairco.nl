<?php
// Voorbeeld PHP implementatie voor server-side webhook aanroep
// Dit is veiliger omdat de secret niet zichtbaar is in de browser

// Webhook configuratie
$webhookUrl = 'https://crm.staycoolairco.nl/api/webhook/leads?tenant=80496bff-b559-4b80-9102-3a84afdaa616';
$webhookSecret = 'wh_secret_abc123xyz789';

// Ontvang form data
$name = $_POST['name'] ?? '';
$email = $_POST['email'] ?? '';
$phone = $_POST['phone'] ?? '';
$company = $_POST['company'] ?? '';
$message = $_POST['message'] ?? '';

// Validatie
if (empty($name) || empty($email)) {
    http_response_code(400);
    echo json_encode(['error' => 'Naam en email zijn verplicht']);
    exit;
}

// Maak payload
$payload = [
    'name' => $name,
    'email' => $email,
    'phone' => $phone,
    'company' => $company,
    'message' => $message,
    'source' => 'website_contact_form'
];

// Verwijder lege waardes
$payload = array_filter($payload);

// Genereer signature
$jsonPayload = json_encode($payload);
$signature = 'sha256=' . hash_hmac('sha256', $jsonPayload, $webhookSecret);

// Verstuur naar webhook
$ch = curl_init($webhookUrl);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonPayload);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-Webhook-Signature: ' . $signature
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Handle response
if ($httpCode === 201) {
    echo json_encode(['success' => true, 'message' => 'Lead succesvol aangemaakt']);
} else {
    http_response_code($httpCode);
    echo $response;
}
?>