require "test_helper"

class PagesControllerTest < ActionDispatch::IntegrationTest
  test "should get root (fr)" do
    get root_url
    assert_response :success
    assert_select "h1", text: /Comprenez/
  end

  test "should get root (en)" do
    get root_url(locale: :en)
    assert_response :success
    assert_select "h1", text: /Understand/
  end

  test "should get privacy (fr)" do
    get privacy_url
    assert_response :success
    assert_select "h1", text: "Politique de confidentialité"
  end

  test "should get privacy (en)" do
    get privacy_url(locale: :en)
    assert_response :success
    assert_select "h1", text: "Privacy Policy"
  end
end
