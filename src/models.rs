use serde::{Deserialize, Serialize};

/// The bundled alternate icon to display. `None` restores the primary icon.
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SetIconRequest {
    pub icon: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CurrentIconResponse {
    pub icon: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::SetIconRequest;

    #[test]
    fn primary_icon_is_serialized_as_null() {
        let request = SetIconRequest { icon: None };

        assert_eq!(serde_json::to_string(&request).unwrap(), r#"{"icon":null}"#);
    }

    #[test]
    fn alternate_icon_is_deserialized() {
        let request: SetIconRequest = serde_json::from_str(r#"{"icon":"midnight"}"#).unwrap();

        assert_eq!(request.icon.as_deref(), Some("midnight"));
    }
}
