import { DrawerItem, UserRole } from "@/types";

//* icons
import DashboardIcon from "@mui/icons-material/Dashboard";
import AddTaskIcon from '@mui/icons-material/AddTask';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import ManageHistoryIcon from '@mui/icons-material/ManageHistory';
import ProfileOutlined from "@mui/icons-material/ManageAccounts";
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import VideoSettingsIcon from '@mui/icons-material/VideoSettings';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import PetsIcon from '@mui/icons-material/Pets';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import FlagIcon from '@mui/icons-material/Flag';
import CategoryIcon from '@mui/icons-material/Category';
import ArticleIcon from '@mui/icons-material/Article';
import HistoryIcon from '@mui/icons-material/History';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import { USER_ROLE } from "@/constant/role";

export const drawerItems = (role: UserRole): DrawerItem[] => {
  const roleMenus: DrawerItem[] = [];

  const defaultMenus = [
    {
      title: "My Profile",
      path: `profile`,
      icon: ProfileOutlined,
    },
  ];

  switch (role) {
    case USER_ROLE.SUPER_ADMIN:
    case USER_ROLE.ADMIN:
      roleMenus.push(
        {
          title: "Dashboard",
          path: `admin`,
          icon: DashboardIcon,
        },
        {
          title: "Manage Users",
          path: `admin/manage-users`,
          icon: GroupAddIcon,
        },
        {
          title: "Add Pet",
          path: `admin/add-pet`,
          icon: AddCircleOutlineIcon,
        },
        {
          title: "Manage Pets",
          path: `admin/manage-pet`,
          icon: AcUnitIcon,
        },
        {
          title: "Adoption Requests",
          path: `admin/manage-adoption`,
          icon: ManageHistoryIcon,
        },
        {
          title: "Add Blog",
          path: `admin/add-blog`,
          icon: AddTaskIcon,
        },
        {
          title: "Manage Blogs",
          path: `admin/manage-blogs`,
          icon: VideoSettingsIcon,
        },
        { title: "Shelter Verification", path: `admin/verification`, icon: VerifiedUserIcon },
        { title: "Reports", path: `admin/reports`, icon: FlagIcon },
        { title: "Success Stories", path: `admin/stories`, icon: AutoStoriesOutlinedIcon },
        { title: "Subscriptions", path: `admin/subscriptions`, icon: CreditCardIcon },
        { title: "Lookups", path: `admin/lookups`, icon: CategoryIcon },
        { title: "Content (CMS)", path: `admin/cms`, icon: ArticleIcon },
        { title: "Audit Logs", path: `admin/audit-logs`, icon: HistoryIcon }
      );
      break;

    case USER_ROLE.USER:
      roleMenus.push(
        {
          title: "Dashboard",
          path: `${role}`,
          icon: DashboardIcon,
        },
        {
          title: "Manage Adoption",
          path: `${role}/manage-adoption`,
          icon: ManageHistoryIcon,
        },
        {
          title: "Saved Pets",
          path: `${role}/favorites`,
          icon: FavoriteBorderIcon,
        },
        {
          title: "Messages",
          path: `${role}/messages`,
          icon: ChatBubbleOutlineIcon,
        },
        {
          title: "Notifications",
          path: `${role}/notifications`,
          icon: NotificationsNoneIcon,
        },
        {
          title: "Add Blog",
          path: `${role}/add-blog`,
          icon: AddTaskIcon,
        },
        {
          title: "My Blogs",
          path: `${role}/my-blogs`,
          icon: VideoSettingsIcon,
        },
      );
      break;

    //* owners and shelters share the same dashboard under /dashboard/shelter
    case USER_ROLE.SHELTER:
    case USER_ROLE.OWNER: {
      const base = "shelter";
      roleMenus.push(
        { title: "Overview", path: base, icon: DashboardIcon },
        { title: "My Listings", path: `${base}/listings`, icon: PetsIcon },
        { title: "Applications", path: `${base}/applications`, icon: ManageHistoryIcon },
        { title: "Visits", path: `${base}/visits`, icon: EventAvailableOutlinedIcon },
        { title: "Success Stories", path: `${base}/stories`, icon: AutoStoriesOutlinedIcon },
        { title: "Messages", path: `${base}/messages`, icon: ChatBubbleOutlineIcon },
        { title: "Team", path: `${base}/members`, icon: GroupAddIcon },
        { title: "Plan & Billing", path: `${base}/billing`, icon: CreditCardIcon }
      );
      break;
    }

    default:
      break;
  }

  return [...roleMenus, ...defaultMenus];
};
