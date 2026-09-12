import UserLayout from './(user)/layout';
import SocialHomePage from './(user)/home/page';

export default function RootPage() {
  return (
    <UserLayout>
      <SocialHomePage />
    </UserLayout>
  );
}
